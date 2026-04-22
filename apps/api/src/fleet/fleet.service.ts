import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { $Enums, Vehicle, VehiclePhoto } from '@prisma/client';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  UpdateVehicleStatusDto,
  AddPhotoDto,
} from './fleet.dto';

type VehicleWithPhotos = Vehicle & {
  photos: (VehiclePhoto & { url: string })[];
};

export interface FleetSummary {
  total: number;
  available: number;
  onHire: number;
  inRepair: number;
  inService: number;
  notAvailable: number;
}

@Injectable()
export class FleetService {
  private readonly logger = new Logger(FleetService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  findAll(branchId?: string): Promise<Vehicle[]> {
    const isBranchFiltered = branchId && branchId !== 'null' && branchId !== 'all';
    return this.prisma.vehicle.findMany({
      where: isBranchFiltered ? { branchId } : undefined,
      include: { branch: true, photos: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<VehicleWithPhotos | null> {
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
      })),
    );
    return { ...vehicle, photos };
  }

  create(data: CreateVehicleDto): Promise<Vehicle> {
    const { branchId, ...rest } = data;
    // Build the Prisma create payload explicitly to satisfy the strict input type.
    // `colour` is optional in our DTO but required by Prisma — we default to ''
    // so existing callers that omit it don't break, and you can tighten this later.
    return this.prisma.vehicle.create({
      data: {
        make: rest.make,
        model: rest.model,
        year: rest.year,
        registration: rest.registration,
        colour: rest.colour ?? '',
        state: rest.state ?? '',
        category: rest.category ?? '',
        status: rest.status,
        ...(branchId ? { branch: { connect: { id: branchId } } } : {}),
      },
      include: { branch: true },
    });
  }

  update(id: string, data: UpdateVehicleDto): Promise<Vehicle> {
    return this.prisma.vehicle.update({
      where: { id },
      data,
      include: { branch: true },
    });
  }

  updateStatus(id: string, data: UpdateVehicleStatusDto): Promise<Vehicle> {
    return this.prisma.vehicle.update({
      where: { id },
      data: { status: data.status },
      include: { branch: true },
    });
  }

  async getFleetSummary(branchId?: string): Promise<FleetSummary> {
    const isBranchFiltered = branchId && branchId !== 'null' && branchId !== 'all';
    const vehicles = await this.prisma.vehicle.findMany({
      where: isBranchFiltered ? { branchId } : undefined,
    });
    return {
      total: vehicles.length,
      available: vehicles.filter((v) => v.status === $Enums.VehicleStatus.AVAILABLE).length,
      onHire: vehicles.filter((v) => v.status === $Enums.VehicleStatus.ON_HIRE).length,
      inRepair: vehicles.filter(
        (v) =>
          v.status === $Enums.VehicleStatus.IN_REPAIR ||
          v.status === $Enums.VehicleStatus.BOOKED_FOR_REPAIR,
      ).length,
      inService: vehicles.filter(
        (v) =>
          v.status === $Enums.VehicleStatus.IN_SERVICE ||
          v.status === $Enums.VehicleStatus.BOOKED_FOR_SERVICE,
      ).length,
      notAvailable: vehicles.filter(
        (v) =>
          v.status === $Enums.VehicleStatus.NOT_AVAILABLE ||
          v.status === $Enums.VehicleStatus.WITH_STAFF ||
          v.status === $Enums.VehicleStatus.CLEAN_NEEDED ||
          v.status === $Enums.VehicleStatus.RESERVED_FOR_TRANSPORT,
      ).length,
    };
  }

  async addPhoto(vehicleId: string, data: AddPhotoDto): Promise<VehiclePhoto> {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    const photoCount = await this.prisma.vehiclePhoto.count({ where: { vehicleId } });
    if (photoCount >= 10) throw new Error('Maximum of 10 photos allowed per vehicle');
    const mimeType = data.mimeType ?? 'image/jpeg';
    const buffer = Buffer.from(data.fileData, 'base64');
    const ext = mimeType.split('/')[1] || 'jpg';
    const key = `vehicle-photos/${vehicleId}/${Date.now()}.${ext}`;
    await this.storage.upload(key, buffer, mimeType);
    return this.prisma.vehiclePhoto.create({
      data: {
        vehicle: { connect: { id: vehicleId } },
        url: '',
        key,
        caption: data.caption ?? null,
      },
    });
  }

  async deletePhoto(id: string): Promise<VehiclePhoto> {
    const photo = await this.prisma.vehiclePhoto.findUnique({ where: { id } });
    if (photo?.key) {
      try {
        await this.storage.delete(photo.key);
      } catch (err) {
        this.logger.warn(`Failed to delete R2 object ${photo.key}: ${(err as Error).message}`);
      }
    }
    return this.prisma.vehiclePhoto.delete({ where: { id } });
  }

  async getPhotos(vehicleId: string): Promise<(VehiclePhoto & { url: string })[]> {
    const photos = await this.prisma.vehiclePhoto.findMany({
      where: { vehicleId },
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

