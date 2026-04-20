import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class FleetService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  findAll(branchId?: string) {
    return this.prisma.vehicle.findMany({
      where: (branchId && branchId !== 'null' && branchId !== 'all') ? { branchId } : undefined,
      include: { branch: true, photos: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        branch: true,
        photos: true,
        reservations: {
          include: { customer: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!vehicle) return null;
    const photos = await Promise.all(
      vehicle.photos.map(async (p) => ({
        ...p,
        url: p.key ? await this.storage.getPresignedUrl(p.key) : p.url,
      }))
    );
    return { ...vehicle, photos };
  }

  create(data: any) {
    const { branchId, ...rest } = data;
    return this.prisma.vehicle.create({
      data: {
        ...rest,
        ...(branchId ? { branch: { connect: { id: branchId } } } : {}),
      },
      include: { branch: true },
    });
  }

  update(id: string, data: any) {
    return this.prisma.vehicle.update({
      where: { id },
      data,
      include: { branch: true },
    });
  }

  updateStatus(id: string, status: string) {
    return this.prisma.vehicle.update({
      where: { id },
      data: { status: status as any },
      include: { branch: true },
    });
  }

  async getFleetSummary(branchId?: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: (branchId && branchId !== 'null' && branchId !== 'all') ? { branchId } : undefined,
    });
    return {
      total: vehicles.length,
      available: vehicles.filter(v => v.status === 'AVAILABLE').length,
      onHire: vehicles.filter(v => v.status === 'ON_HIRE').length,
      inRepair: vehicles.filter(v => v.status === 'IN_REPAIR' || v.status === 'BOOKED_FOR_REPAIR').length,
      inService: vehicles.filter(v => v.status === 'IN_SERVICE' || v.status === 'BOOKED_FOR_SERVICE').length,
      notAvailable: vehicles.filter(v => v.status === 'NOT_AVAILABLE' || v.status === 'WITH_STAFF' || v.status === 'CLEAN_NEEDED' || v.status === 'RESERVED_FOR_TRANSPORT').length,
    };
  }

  async addPhoto(vehicleId: string, data: any) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const photoCount = await this.prisma.vehiclePhoto.count({ where: { vehicleId } });
    if (photoCount >= 10) throw new Error('Maximum of 10 photos allowed per vehicle');

    const buffer = Buffer.from(data.fileData, 'base64');
    const ext = (data.mimeType || 'image/jpeg').split('/')[1] || 'jpg';
    const key = `vehicle-photos/${vehicleId}/${Date.now()}.${ext}`;
    await this.storage.upload(key, buffer, data.mimeType || 'image/jpeg');

    return this.prisma.vehiclePhoto.create({
      data: {
        vehicle: { connect: { id: vehicleId } },
        url: '',
        key,
        caption: data.caption || null,
      },
    });
  }

  async deletePhoto(id: string) {
    const photo = await this.prisma.vehiclePhoto.findUnique({ where: { id } });
    if (photo?.key) {
      try { await this.storage.delete(photo.key); } catch (_) {}
    }
    return this.prisma.vehiclePhoto.delete({ where: { id } });
  }

  async getPhotos(vehicleId: string) {
    const photos = await this.prisma.vehiclePhoto.findMany({
      where: { vehicleId },
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