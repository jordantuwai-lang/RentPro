import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  async generateReservationNumber(): Promise<string> {
    const result = await this.prisma.$transaction(async (tx) => {
      let counter = await tx.reservationCounter.findUnique({ where: { id: 1 } });
      if (!counter) {
        counter = await tx.reservationCounter.create({ data: { id: 1, current: 1000 } });
      }
      const next = counter.current + 1;
      await tx.reservationCounter.update({ where: { id: 1 }, data: { current: next } });
      return `REZ${next}`;
    });
    return result;
  }

  findAll(branchId?: string) {
    return this.prisma.reservation.findMany({
      where: (branchId && branchId !== 'null' && branchId !== 'all') ? { vehicle: { branchId } } : undefined,
      include: {
        customer: true,
        vehicle: { include: { branch: true } },
        claim: true,
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.reservation.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: { include: { branch: true } },
        claim: {
          include: {
            insurer: true,
            repairer: true,
            documents: true,
            invoices: true,
            accidentDetails: true,
            atFaultParty: true,
            repairDetails: true,
            notes: { orderBy: { createdAt: 'desc' } },
          },
        },
        delivery: true,
        paymentCards: true,
        additionalDrivers: true,
        reservationNotes: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async create(data: any) {
    const reservationNumber = await this.generateReservationNumber();

    // Support both data.customer (old edit form) and data.driver (new intake form)
    const customerData = data.driver || data.customer;

    // Create the reservation first
    const reservation = await this.prisma.reservation.create({
      data: {
        reservationNumber,
        customer: { create: customerData },
        vehicle: data.vehicleId ? { connect: { id: data.vehicleId } } : undefined,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status === 'DRAFT' ? 'DRAFT' : 'PENDING',
        sourceOfBusiness: data.sourceOfBusiness || undefined,
        partnerName: data.partnerName || undefined,
      },
      include: { customer: true, vehicle: true },
    });

    // If a vehicle is assigned and not a draft, mark it on hire
    if (data.vehicleId && data.status !== 'DRAFT') {
      const vehicle = await this.prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
      if (!vehicle) throw new NotFoundException('Vehicle not found');
      if (vehicle.status !== 'AVAILABLE') throw new BadRequestException('Vehicle is not available');
      await this.prisma.vehicle.update({
        where: { id: data.vehicleId },
        data: { status: 'ON_HIRE' },
      });
    }

    // Build accident details from intake form
    const accidentData = data.accident || {};
    const atFaultData = data.atFault || {};
    const additionalData = data.additional || {};
    const nafVehicle = data.nafVehicle || {};

    // Create linked Claim with child models
    await this.prisma.claim.create({
      data: {
        reservation: { connect: { id: reservation.id } },
        hireType: data.hireType === 'Credit Hire' ? 'CREDIT_HIRE' : data.hireType === 'Direct Hire' ? 'DIRECT_HIRE' : undefined,
        sourceOfBusiness: data.sourceOfBusiness || undefined,

        // Accident details child
        accidentDetails: {
          create: {
            accidentDate: accidentData.date ? new Date(accidentData.date) : undefined,
            accidentLocation: accidentData.location || undefined,
            accidentDescription: accidentData.description || undefined,
            policeEventNo: additionalData.policeReportNo || undefined,
            policeStation: additionalData.policeStation || undefined,
            policeContactName: additionalData.policeOfficerName || undefined,
            policePhone: additionalData.policeOfficerPhone || undefined,
            witnessName: additionalData.witnessName || undefined,
            witnessPhone: additionalData.witnessPhone || undefined,
          },
        },

        // At fault party child
        atFaultParty: {
          create: {
            firstName: atFaultData.firstName || undefined,
            lastName: atFaultData.lastName || undefined,
            phone: atFaultData.phone || undefined,
            email: atFaultData.email || undefined,
            streetAddress: atFaultData.address || undefined,
            suburb: atFaultData.suburb || undefined,
            postcode: atFaultData.postcode || undefined,
            state: atFaultData.state || undefined,
            vehicleRego: atFaultData.vehicleRegistration || undefined,
            vehicleMake: atFaultData.vehicleMake || undefined,
            vehicleModel: atFaultData.vehicleModel || undefined,
            vehicleYear: atFaultData.vehicleYear ? parseInt(atFaultData.vehicleYear) : undefined,
            theirInsurer: atFaultData.insuranceProvider || undefined,
            theirClaimNo: atFaultData.claimNumber || undefined,
          },
        },
      },
    });

    return reservation;
  }

  async update(id: string, data: any) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        customer: true,
        claim: {
          include: {
            accidentDetails: true,
            atFaultParty: true,
            repairDetails: true,
          },
        },
      },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');

    // ── Vehicle status management ─────────────────────────────────────────────

    if (data.status === 'COMPLETED' && reservation.vehicleId) {
      await this.prisma.vehicle.update({
        where: { id: reservation.vehicleId },
        data: { status: 'AVAILABLE' },
      });
    }

    if (data.vehicleId && data.vehicleId !== reservation.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
      if (!vehicle) throw new NotFoundException('Vehicle not found');

      if (reservation.vehicleId) {
        await this.prisma.vehicle.update({
          where: { id: reservation.vehicleId },
          data: { status: 'AVAILABLE' },
        });
      }

      if (data.status !== 'DRAFT') {
        await this.prisma.vehicle.update({
          where: { id: data.vehicleId },
          data: { status: 'ON_HIRE' },
        });
      }
    }

    // ── Customer update ────────────────────────────────────────────────────────

    const customerUpdate = data.driver || data.customer;
    if (customerUpdate && reservation.customerId) {
      await this.prisma.customer.update({
        where: { id: reservation.customerId },
        data: {
          firstName: customerUpdate.firstName || undefined,
          lastName: customerUpdate.lastName || undefined,
          phone: customerUpdate.phone || undefined,
          email: customerUpdate.email || undefined,
          address: customerUpdate.address || undefined,
          suburb: customerUpdate.suburb || undefined,
          postcode: customerUpdate.postcode || undefined,
          state: customerUpdate.state || undefined,
          licenceNumber: customerUpdate.licenceNumber || undefined,
          licenceState: customerUpdate.licenceState || undefined,
          licenceExpiry: customerUpdate.licenceExpiry || undefined,
          dob: customerUpdate.dob || undefined,
        },
      });
    }

    // ── Claim + child models update ────────────────────────────────────────────

    const accidentData = data.accident || {};
    const atFaultData = data.atFault || {};
    const additionalData = data.additional || {};

    if (reservation.claim) {
      const claimId = reservation.claim.id;

      // Update or create AccidentDetails
      const accidentPayload = {
        accidentDate: accidentData.date ? new Date(accidentData.date) : undefined,
        accidentLocation: accidentData.location || undefined,
        accidentDescription: accidentData.description || undefined,
        policeEventNo: additionalData.policeReportNo || undefined,
        policeStation: additionalData.policeStation || undefined,
        policeContactName: additionalData.policeOfficerName || undefined,
        policePhone: additionalData.policeOfficerPhone || undefined,
        witnessName: additionalData.witnessName || undefined,
        witnessPhone: additionalData.witnessPhone || undefined,
      };

      if (reservation.claim.accidentDetails) {
        await this.prisma.accidentDetails.update({
          where: { claimId },
          data: accidentPayload,
        });
      } else {
        await this.prisma.accidentDetails.create({
          data: { claim: { connect: { id: claimId } }, ...accidentPayload },
        });
      }

      // Update or create AtFaultParty
      const atFaultPayload = {
        firstName: atFaultData.firstName || undefined,
        lastName: atFaultData.lastName || undefined,
        phone: atFaultData.phone || undefined,
        email: atFaultData.email || undefined,
        streetAddress: atFaultData.address || undefined,
        suburb: atFaultData.suburb || undefined,
        postcode: atFaultData.postcode || undefined,
        state: atFaultData.state || undefined,
        vehicleRego: atFaultData.vehicleRegistration || undefined,
        vehicleMake: atFaultData.vehicleMake || undefined,
        vehicleModel: atFaultData.vehicleModel || undefined,
        vehicleYear: atFaultData.vehicleYear ? parseInt(atFaultData.vehicleYear) : undefined,
        theirInsurer: atFaultData.insuranceProvider || undefined,
        theirClaimNo: atFaultData.claimNumber || undefined,
      };

      if (reservation.claim.atFaultParty) {
        await this.prisma.atFaultParty.update({
          where: { claimId },
          data: atFaultPayload,
        });
      } else {
        await this.prisma.atFaultParty.create({
          data: { claim: { connect: { id: claimId } }, ...atFaultPayload },
        });
      }

      // Update claim top-level fields if provided
      if (data.hireType || data.sourceOfBusiness) {
        await this.prisma.claim.update({
          where: { id: claimId },
          data: {
            hireType: data.hireType === 'Credit Hire' ? 'CREDIT_HIRE' : data.hireType === 'Direct Hire' ? 'DIRECT_HIRE' : undefined,
            sourceOfBusiness: data.sourceOfBusiness || undefined,
          },
        });
      }
    } else if (data.accident || data.atFault || data.additional) {
      // No claim exists yet — create one with child models
      const accidentPayload = {
        accidentDate: accidentData.date ? new Date(accidentData.date) : undefined,
        accidentLocation: accidentData.location || undefined,
        accidentDescription: accidentData.description || undefined,
        policeEventNo: additionalData.policeReportNo || undefined,
        policeStation: additionalData.policeStation || undefined,
        policeContactName: additionalData.policeOfficerName || undefined,
        policePhone: additionalData.policeOfficerPhone || undefined,
        witnessName: additionalData.witnessName || undefined,
        witnessPhone: additionalData.witnessPhone || undefined,
      };

      const atFaultPayload = {
        firstName: atFaultData.firstName || undefined,
        lastName: atFaultData.lastName || undefined,
        phone: atFaultData.phone || undefined,
        email: atFaultData.email || undefined,
        streetAddress: atFaultData.address || undefined,
        suburb: atFaultData.suburb || undefined,
        postcode: atFaultData.postcode || undefined,
        state: atFaultData.state || undefined,
        vehicleRego: atFaultData.vehicleRegistration || undefined,
        vehicleMake: atFaultData.vehicleMake || undefined,
        vehicleModel: atFaultData.vehicleModel || undefined,
        vehicleYear: atFaultData.vehicleYear ? parseInt(atFaultData.vehicleYear) : undefined,
        theirInsurer: atFaultData.insuranceProvider || undefined,
        theirClaimNo: atFaultData.claimNumber || undefined,
      };

      await this.prisma.claim.create({
        data: {
          reservation: { connect: { id } },
          hireType: data.hireType === 'Credit Hire' ? 'CREDIT_HIRE' : data.hireType === 'Direct Hire' ? 'DIRECT_HIRE' : undefined,
          sourceOfBusiness: data.sourceOfBusiness || undefined,
          accidentDetails: { create: accidentPayload },
          atFaultParty: { create: atFaultPayload },
        },
      });
    }

    // ── Reservation top-level update ──────────────────────────────────────────

    return this.prisma.reservation.update({
      where: { id },
      data: {
        status: data.status || undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        sourceOfBusiness: data.sourceOfBusiness || undefined,
        vehicle: data.vehicleId ? { connect: { id: data.vehicleId } } : undefined,
      },
      include: {
        customer: true,
        vehicle: { include: { branch: true } },
        claim: {
          include: {
            accidentDetails: true,
            atFaultParty: true,
            repairDetails: true,
          },
        },
      },
    });
  }

  async cancel(id: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reservation not found');

    if (reservation.vehicleId) {
      await this.prisma.vehicle.update({
        where: { id: reservation.vehicleId },
        data: { status: 'AVAILABLE' },
      });
    }

    return this.prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  checkAvailability(branchId: string, category: string, startDate: string) {
    return this.prisma.vehicle.findMany({
      where: { branchId, category, status: 'AVAILABLE' },
    });
  }

  generateCardReference(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'CARD-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async generateFileNumber(branchCode: string): Promise<string> {
    const result = await this.prisma.$transaction(async (tx) => {
      let counter = await tx.fileNumberCounter.findUnique({ where: { id: 1 } });
      if (!counter) {
        counter = await tx.fileNumberCounter.create({ data: { id: 1, KPK: 0, COB: 0 } });
      }
      const field = branchCode === 'KPK' ? 'KPK' : 'COB';
      const next = (counter[field as keyof typeof counter] as number) + 1;
      await tx.fileNumberCounter.update({ where: { id: 1 }, data: { [field]: next } });
      return `${branchCode}RP-${next}`;
    });
    return result;
  }

  async markOnHire(id: string, data: any) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { vehicle: { include: { branch: true } } },
    });
    if (!reservation) throw new Error('Reservation not found');

    const branchCode = reservation.vehicle?.branch?.code || 'KPK';
    const fileNumber = await this.generateFileNumber(branchCode);

    if (reservation.vehicleId) {
      await this.prisma.vehicle.update({
        where: { id: reservation.vehicleId },
        data: { status: 'ON_HIRE' },
      });
    }

    return this.prisma.reservation.update({
      where: { id },
      data: { status: 'ACTIVE', fileNumber },
      include: { customer: true, vehicle: { include: { branch: true } } },
    });
  }

  addNote(reservationId: string, data: any) {
    return this.prisma.reservationNote.create({
      data: {
        reservation: { connect: { id: reservationId } },
        note: data.note,
        authorName: data.authorName,
      },
    });
  }

  getNotes(reservationId: string) {
    return this.prisma.reservationNote.findMany({
      where: { reservationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addPaymentCard(reservationId: string, data: any) {
    let referenceCode = this.generateCardReference();
    let exists = await this.prisma.paymentCard.findFirst({ where: { referenceCode } });
    while (exists) {
      referenceCode = this.generateCardReference();
      exists = await this.prisma.paymentCard.findFirst({ where: { referenceCode } });
    }
    return this.prisma.paymentCard.create({
      data: {
        reservation: { connect: { id: reservationId } },
        cardType: data.cardType,
        cardNumber: data.cardNumber,
        expiryDate: data.expiryDate,
        cardholderName: data.cardholderName,
        referenceCode,
      },
    });
  }

  deletePaymentCard(id: string) {
    return this.prisma.paymentCard.delete({ where: { id } });
  }

  addAdditionalDriver(reservationId: string, data: any) {
    return this.prisma.additionalDriver.create({
      data: {
        reservation: { connect: { id: reservationId } },
        firstName: data.firstName,
        lastName: data.lastName,
        licenceNumber: data.licenceNumber,
        licenceExpiry: data.licenceExpiry || null,
        dob: data.dob || null,
        phone: data.phone || null,
      },
    });
  }

  deleteAdditionalDriver(id: string) {
    return this.prisma.additionalDriver.delete({ where: { id } });
  }

  async getNextNumber() {
    const counter = await this.prisma.reservationCounter.findFirst();
    const next = (counter?.current ?? 1000) + 1;
    return { nextNumber: `REZ${next}` };
  }

  async getCancellationReasons(from?: string, to?: string) {
    const where: any = { status: 'CANCELLED' };
    if (from && to) {
      where.updatedAt = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }
    const reservations = await this.prisma.reservation.findMany({
      where,
      select: {
        cancellationReason: true,
        cancellationComment: true,
        updatedAt: true,
      },
    });
    return reservations;
  }

  async uploadLicencePhoto(id: string, url: string) {
    return this.prisma.reservation.update({
      where: { id },
      data: { licencePhotoUrl: url },
    });
  }

  async getLicencePhoto(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      select: { licencePhotoUrl: true },
    });
    return { licencePhotoUrl: reservation?.licencePhotoUrl || null };
  }
  async addToSchedule(reservationId: string, body: {
    scheduledAt: string;
    jobType: string;
    address: string;
    suburb: string;
    postcode?: string;
    driverId?: string;
  }) {
    const { scheduledAt, jobType, address, suburb, postcode, driverId } = body;
  
    return this.prisma.delivery.upsert({
      where: { reservationId },
      create: {
        reservationId,
        scheduledAt: new Date(scheduledAt),
        jobType: jobType as any,
        address,
        suburb,
        postcode: postcode || '',
        status: 'SCHEDULED',
        driverId: driverId || null,
      },
      update: {
        scheduledAt: new Date(scheduledAt),
        jobType: jobType as any,
        address,
        suburb,
        postcode: postcode || '',
        status: 'SCHEDULED',
        driverId: driverId || null,
      },
    });
  }
}
