import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

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
      },
    });
  }

  async create(data: any) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.status !== 'AVAILABLE') {
      throw new BadRequestException('Vehicle is not available');
    }

    const reservation = await this.prisma.reservation.create({
      data: {
        customer: { create: data.customer },
        vehicle: { connect: { id: data.vehicleId } },
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: 'PENDING',
      },
      include: {
        customer: true,
        vehicle: true,
      },
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
    });

    if (!reservation) throw new NotFoundException('Reservation not found');

    if (data.status === 'COMPLETED') {
      await this.prisma.vehicle.update({
        where: { id: reservation.vehicleId },
        data: { status: 'AVAILABLE' },
      });
    }

    return this.prisma.reservation.update({
      where: { id },
      data: {
        status: data.status,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: {
        customer: true,
        vehicle: true,
      },
    });
  }

  async cancel(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) throw new NotFoundException('Reservation not found');

    await this.prisma.vehicle.update({
      where: { id: reservation.vehicleId },
      data: { status: 'AVAILABLE' },
    });

    return this.prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  checkAvailability(branchId: string, category: string, startDate: string) {
    return this.prisma.vehicle.findMany({
      where: {
        branchId,
        category,
        status: 'AVAILABLE',
      },
    });
  }
}
