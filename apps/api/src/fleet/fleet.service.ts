import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FleetService {
  constructor(private prisma: PrismaService) {}

  findAll(branchId?: string) {
    return this.prisma.vehicle.findMany({
      where: branchId ? { branchId } : undefined,
      include: { branch: true, photos: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.vehicle.findUnique({
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
  }

  create(data: any) {
    return this.prisma.vehicle.create({
      data,
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
      where: branchId ? { branchId } : undefined,
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

    return this.prisma.vehiclePhoto.create({
      data: {
        vehicle: { connect: { id: vehicleId } },
        url: data.url,
        key: data.key,
        caption: data.caption || null,
      },
    });
  }

  deletePhoto(id: string) {
    return this.prisma.vehiclePhoto.delete({ where: { id } });
  }

  getPhotos(vehicleId: string) {
    return this.prisma.vehiclePhoto.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
