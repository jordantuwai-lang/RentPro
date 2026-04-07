import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogisticsService {
  constructor(private prisma: PrismaService) {}

  findAll(driverId?: string) {
    return this.prisma.delivery.findMany({
      where: driverId ? { driverId } : undefined,
      include: {
        reservation: { include: { customer: true, vehicle: { include: { branch: true } }, paymentCards: true, additionalDrivers: true } },
        driver: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.delivery.findUnique({
      where: { id },
      include: {
        reservation: { include: { customer: true, vehicle: { include: { branch: true } } } },
        driver: true,
      },
    });
  }

  getTodaysDeliveries(branchId?: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.prisma.delivery.findMany({
      where: {
        scheduledAt: { gte: start, lte: end },
      },
      include: {
        reservation: { include: { customer: true, vehicle: { include: { branch: true } }, paymentCards: true, additionalDrivers: true } },
        driver: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  create(data: any) {
    const deliveryData: any = {
      reservation: { connect: { id: data.reservationId } },
      address: data.address,
      suburb: data.suburb,
      scheduledAt: new Date(data.scheduledAt),
      notes: data.notes || null,
      status: 'SCHEDULED',
    };

    if (data.driverId) {
      deliveryData.driver = { connect: { id: data.driverId } };
    }

    return this.prisma.delivery.create({
      data: deliveryData,
      include: {
        reservation: { include: { customer: true, vehicle: { include: { branch: true } }, paymentCards: true, additionalDrivers: true } },
        driver: true,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id } });
    if (!delivery) throw new NotFoundException('Delivery not found');

    return this.prisma.delivery.update({
      where: { id },
      data: {
        status: status as any,
        deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
      },
      include: {
        reservation: { include: { customer: true, vehicle: { include: { branch: true } }, paymentCards: true, additionalDrivers: true } },
        driver: true,
      },
    });
  }

  update(id: string, data: any) {
    return this.prisma.delivery.update({
      where: { id },
      data: {
        address: data.address,
        suburb: data.suburb,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        driverId: data.driverId,
        notes: data.notes,
      },
      include: {
        reservation: { include: { customer: true, vehicle: { include: { branch: true } }, paymentCards: true, additionalDrivers: true } },
        driver: true,
      },
    });
  }
}
