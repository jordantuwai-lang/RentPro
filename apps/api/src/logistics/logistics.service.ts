import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class LogisticsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

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

  async findOne(id: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        reservation: { include: { customer: true, vehicle: { include: { branch: true } }, paymentCards: true, additionalDrivers: true } },
        driver: true,
        photos: true,
      },
    });
    if (!delivery) return null;
    const photos = await Promise.all(
      delivery.photos.map(async (p) => ({
        ...p,
        url: p.key ? await this.storage.getPresignedUrl(p.key) : p.url,
      }))
    );
    return { ...delivery, photos };
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

    const buffer = Buffer.from(data.fileData, 'base64');
    const ext = (data.mimeType || 'image/jpeg').split('/')[1] || 'jpg';
    const key = `delivery-photos/${deliveryId}/${Date.now()}.${ext}`;
    await this.storage.upload(key, buffer, data.mimeType || 'image/jpeg');

    return this.prisma.deliveryPhoto.create({
      data: {
        delivery: { connect: { id: deliveryId } },
        url: '',
        key,
        caption: data.caption || null,
      },
    });
  }

  async deleteDeliveryPhoto(id: string) {
    const photo = await this.prisma.deliveryPhoto.findUnique({ where: { id } });
    if (photo?.key) {
      try { await this.storage.delete(photo.key); } catch (_) {}
    }
    return this.prisma.deliveryPhoto.delete({ where: { id } });
  }

  async getDeliveryPhotos(deliveryId: string) {
    const photos = await this.prisma.deliveryPhoto.findMany({
      where: { deliveryId },
      orderBy: { createdAt: 'asc' },
    });
    return Promise.all(
      photos.map(async (p) => ({
        ...p,
        url: p.key ? await this.storage.getPresignedUrl(p.key) : p.url,
      }))
    );
  }
}