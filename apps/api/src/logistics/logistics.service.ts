import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { $Enums, Delivery, DeliveryPhoto } from '@prisma/client';
import {
  CreateDeliveryDto,
  UpdateDeliveryDto,
  UpdateDeliveryStatusDto,
  AddDeliveryPhotoDto,
} from './logistics.dto';

const DELIVERY_INCLUDE = {
  reservation: {
    include: {
      customer: true,
      vehicle: { include: { branch: true } },
      paymentCards: true,
      additionalDrivers: true,
    },
  },
  driver: true,
} as const;

function branchFilter(branchId?: string) {
  if (branchId && branchId !== 'null' && branchId !== 'all') {
    return { reservation: { vehicle: { branchId } } };
  }
  return undefined;
}

@Injectable()
export class LogisticsService {
  private readonly logger = new Logger(LogisticsService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  findAll(branchId?: string): Promise<Delivery[]> {
    return this.prisma.delivery.findMany({
      where: branchFilter(branchId),
      include: DELIVERY_INCLUDE,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  findToday(branchId?: string): Promise<Delivery[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return this.prisma.delivery.findMany({
      where: {
        scheduledAt: { gte: start, lte: end },
        ...branchFilter(branchId),
      },
      include: DELIVERY_INCLUDE,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findTodayForDriver(clerkId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return this.prisma.delivery.findMany({
      where: {
        driver: { clerkId },
        scheduledAt: {
          gte: start,
          lt: end,
        },
        status: { not: $Enums.DeliveryStatus.DELIVERED },
      },
      include: DELIVERY_INCLUDE,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findOne(id: string): Promise<(Delivery & { photos: (DeliveryPhoto & { url: string })[] }) | null> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: { ...DELIVERY_INCLUDE, photos: true },
    });
    if (!delivery) return null;
    const photos = await Promise.all(
      delivery.photos.map(async (p) => ({
        ...p,
        url: p.key ? await this.storage.getPresignedUrl(p.key) : p.url,
      })),
    );
    return { ...delivery, photos };
  }

  create(data: CreateDeliveryDto): Promise<Delivery> {
    return this.prisma.delivery.create({
      data: {
        reservation: { connect: { id: data.reservationId } },
        address: data.address,
        suburb: data.suburb,
        scheduledAt: new Date(data.scheduledAt),
        notes: data.notes ?? null,
        // Use Prisma enum value directly — avoids the local enum vs $Enums clash
        status: $Enums.DeliveryStatus.SCHEDULED,
        jobType: data.jobType ?? $Enums.JobType.DELIVERY,
        ...(data.driverId ? { driver: { connect: { id: data.driverId } } } : {}),
      },
      include: DELIVERY_INCLUDE,
    });
  }

  async updateStatus(id: string, data: UpdateDeliveryStatusDto): Promise<Delivery> {
    const delivery = await this.prisma.delivery.findUnique({ where: { id } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    return this.prisma.delivery.update({
      where: { id },
      data: {
        // Cast to any here only because Prisma's update input wraps enums in
        // EnumXFieldUpdateOperationsInput — the value is still correctly typed
        // at runtime since data.status comes from the validated DTO enum.
        status: data.status as unknown as $Enums.DeliveryStatus,
        deliveredAt: data.status === $Enums.DeliveryStatus.DELIVERED ? new Date() : undefined,
      },
      include: DELIVERY_INCLUDE,
    });
  }

  update(id: string, data: UpdateDeliveryDto): Promise<Delivery> {
    return this.prisma.delivery.update({
      where: { id },
      data: {
        address: data.address,
        suburb: data.suburb,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        driverId: data.driverId !== undefined ? data.driverId : undefined,
        notes: data.notes,
        // Same cast pattern as updateStatus above
        jobType: data.jobType !== undefined
          ? (data.jobType as unknown as $Enums.JobType)
          : undefined,
      },
      include: DELIVERY_INCLUDE,
    });
  }

  async bulkAssignDriver(jobIds: string[], driverId: string): Promise<{ updated: number }> {
    await this.prisma.delivery.updateMany({
      where: { id: { in: jobIds } },
      data: { driverId },
    });
    return { updated: jobIds.length };
  }

  async addDeliveryPhoto(deliveryId: string, data: AddDeliveryPhotoDto): Promise<DeliveryPhoto> {
    const count = await this.prisma.deliveryPhoto.count({ where: { deliveryId } });
    if (count >= 10) throw new Error('Maximum of 10 photos allowed per delivery');
    const mimeType = data.mimeType ?? 'image/jpeg';
    const buffer = Buffer.from(data.fileData, 'base64');
    const ext = mimeType.split('/')[1] || 'jpg';
    const key = `delivery-photos/${deliveryId}/${Date.now()}.${ext}`;
    await this.storage.upload(key, buffer, mimeType);
    return this.prisma.deliveryPhoto.create({
      data: {
        delivery: { connect: { id: deliveryId } },
        url: '',
        key,
        caption: data.caption ?? null,
      },
    });
  }

  async deleteDeliveryPhoto(id: string): Promise<DeliveryPhoto> {
    const photo = await this.prisma.deliveryPhoto.findUnique({ where: { id } });
    if (photo?.key) {
      try {
        await this.storage.delete(photo.key);
      } catch (err) {
        this.logger.warn(`Failed to delete R2 object ${photo.key}: ${(err as Error).message}`);
      }
    }
    return this.prisma.deliveryPhoto.delete({ where: { id } });
  }

  async getDeliveryPhotos(deliveryId: string): Promise<(DeliveryPhoto & { url: string })[]> {
    const photos = await this.prisma.deliveryPhoto.findMany({
      where: { deliveryId },
      orderBy: { createdAt: 'asc' },
    });
    return Promise.all(
      photos.map(async (p) => ({
        ...p,
        url: p.key ? await this.storage.getPresignedUrl(p.key) : p.url,
      })),
    );
  }
}

