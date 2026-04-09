import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogisticsService {
  constructor(private prisma: PrismaService) {}

  findAll(branchId?: string) {
    return this.prisma.delivery.findMany({
      where: (branchId && branchId !== 'null' && branchId !== 'all') ? { reservation: { vehicle: { branchId } } } : undefined,
      include: {
        reservation: { include: { customer: true, vehicle: { include: { branch: true } }, paymentCards: true, additionalDrivers: true } },
        driver: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  findToday(branchId?: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return this.prisma.delivery.findMany({
      where: {
        scheduledAt: { gte: start, lte: end },
        ...((branchId && branchId !== 'null' && branchId !== 'all') ? { reservation: { vehicle: { branchId } } } : {}),
      },
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
        reservation: { include: { customer: true, vehicle: { include: { branch: true } }, paymentCards: true, additionalDrivers: true } },
        driver: true,
        photos: true,
      },
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
      jobType: data.jobType || 'DELIVERY',
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
        driverId: data.driverId !== undefined ? data.driverId : undefined,
        notes: data.notes,
        jobType: data.jobType ? data.jobType : undefined,
      },
      include: {
        reservation: { include: { customer: true, vehicle: { include: { branch: true } }, paymentCards: true, additionalDrivers: true } },
        driver: true,
      },
    });
  }

  async bulkAssignDriver(jobIds: string[], driverId: string) {
    await this.prisma.delivery.updateMany({
      where: { id: { in: jobIds } },
      data: { driverId },
    });
    return { updated: jobIds.length };
  }

  async addDeliveryPhoto(deliveryId: string, data: any) {
    const count = await this.prisma.deliveryPhoto.count({ where: { deliveryId } });
    if (count >= 10) throw new Error('Maximum of 10 photos allowed per delivery');
    return this.prisma.deliveryPhoto.create({
      data: {
        delivery: { connect: { id: deliveryId } },
        url: data.url,
        key: data.key,
        caption: data.caption || null,
      },
    });
  }

  getDeliveryPhotos(deliveryId: string) {
    return this.prisma.deliveryPhoto.findMany({
      where: { deliveryId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
