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
      where: branchId ? { vehicle: { branchId } } : undefined,
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
        claim: { include: { insurer: true, repairer: true, documents: true, invoices: true } },
        delivery: true,
        paymentCards: true,
        additionalDrivers: true,
        reservationNotes: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async create(data: any) {
    const reservationNumber = await this.generateReservationNumber();

    if (data.status === 'DRAFT') {
      return this.prisma.reservation.create({
        data: {
          reservationNumber,
          customer: { create: data.customer },
          vehicle: data.vehicleId ? { connect: { id: data.vehicleId } } : undefined,
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          status: 'DRAFT',
        },
        include: { customer: true, vehicle: true },
      });
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.status !== 'AVAILABLE') {
      throw new BadRequestException('Vehicle is not available');
    }

    const reservation = await this.prisma.reservation.create({
      data: {
        reservationNumber,
        customer: { create: data.customer },
        vehicle: { connect: { id: data.vehicleId } },
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: 'PENDING',
      },
      include: { customer: true, vehicle: true },
    });

    await this.prisma.vehicle.update({
      where: { id: data.vehicleId },
      data: { status: 'ON_HIRE' },
    });

    return reservation;
  }

  async update(id: string, data: any) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');

    if (data.status === 'COMPLETED' && reservation.vehicleId) {
      await this.prisma.vehicle.update({
        where: { id: reservation.vehicleId },
        data: { status: 'AVAILABLE' },
      });
    }

    if (data.vehicleId && data.vehicleId !== reservation.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: data.vehicleId },
      });
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

    if (data.customer && reservation.customerId) {
      await this.prisma.customer.update({
        where: { id: reservation.customerId },
        data: {
          firstName: data.customer.firstName,
          lastName: data.customer.lastName,
          phone: data.customer.phone,
          email: data.customer.email || undefined,
          licenceNumber: data.customer.licenceNumber || undefined,
        },
      });
    }

    return this.prisma.reservation.update({
      where: { id },
      data: {
        status: data.status,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        vehicle: data.vehicleId ? { connect: { id: data.vehicleId } } : undefined,
      },
      include: { customer: true, vehicle: { include: { branch: true } } },
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
        counter = await tx.fileNumberCounter.create({ data: { id: 1, KPK: 1000, COB: 1000 } });
      }
      const field = branchCode === 'KPK' ? 'KPK' : 'COB';
      const next = counter[field as keyof typeof counter] as number + 1;
      await tx.fileNumberCounter.update({ where: { id: 1 }, data: { [field]: next } });
      return `${branchCode}-${next}`;
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
}
