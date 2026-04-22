#!/bin/bash
set -e
REPO="$HOME/rentpro/apps/api/src"
echo "Applying type fixes..."

echo "  -> fleet/fleet.dto.ts"
cat > "$REPO/fleet/fleet.dto.ts" << 'HEREDOC_FLEET_DTO_TS'
import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { $Enums } from '@prisma/client';

// ─── Re-export Prisma enum ────────────────────────────────────────────────────

export const VehicleStatus = $Enums.VehicleStatus;
export type VehicleStatus = $Enums.VehicleStatus;

// ─── Vehicle CRUD ─────────────────────────────────────────────────────────────
// Fields marked required match what Prisma's VehicleCreateInput requires.
// Fields that are required in Prisma but optional in the form are kept optional
// here so the API doesn't break existing callers — Prisma will throw a
// descriptive error if a truly required field is missing at the DB level.

export class CreateVehicleDto {
  @IsString()
  make: string;

  @IsString()
  model: string;

  @IsInt()
  @Min(1900)
  @Max(2100)
  @Type(() => Number)
  year: number;

  @IsString()
  registration: string;

  @IsString()
  @IsOptional()
  colour?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum($Enums.VehicleStatus)
  @IsOptional()
  status?: $Enums.VehicleStatus;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  odometer?: number;

  @IsString()
  @IsOptional()
  vin?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  make?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsInt()
  @IsOptional()
  @Min(1900)
  @Max(2100)
  @Type(() => Number)
  year?: number;

  @IsString()
  @IsOptional()
  registration?: string;

  @IsString()
  @IsOptional()
  colour?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum($Enums.VehicleStatus)
  @IsOptional()
  status?: $Enums.VehicleStatus;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  odometer?: number;

  @IsString()
  @IsOptional()
  vin?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateVehicleStatusDto {
  @IsEnum($Enums.VehicleStatus)
  status: $Enums.VehicleStatus;
}

// ─── Photos ───────────────────────────────────────────────────────────────────

export class AddPhotoDto {
  @IsString()
  fileData: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsString()
  @IsOptional()
  caption?: string;
}

HEREDOC_FLEET_DTO_TS

echo "  -> fleet/fleet.service.ts"
cat > "$REPO/fleet/fleet.service.ts" << 'HEREDOC_FLEET_SERVICE_TS'
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

interface FleetSummary {
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
        category: rest.category,
        status: rest.status,
        odometer: rest.odometer,
        vin: rest.vin,
        notes: rest.notes,
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

HEREDOC_FLEET_SERVICE_TS

echo "  -> logistics/logistics.dto.ts"
cat > "$REPO/logistics/logistics.dto.ts" << 'HEREDOC_LOGISTICS_DTO_TS'
import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { $Enums } from '@prisma/client';

// ─── Re-export Prisma enums so service/controller import from one place ───────

export const DeliveryStatus = $Enums.DeliveryStatus;
export type DeliveryStatus = $Enums.DeliveryStatus;

export const JobType = $Enums.JobType;
export type JobType = $Enums.JobType;

// ─── Delivery CRUD ────────────────────────────────────────────────────────────

export class CreateDeliveryDto {
  @IsString()
  reservationId: string;

  @IsString()
  address: string;

  @IsString()
  suburb: string;

  @IsString()
  scheduledAt: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum($Enums.JobType)
  @IsOptional()
  jobType?: $Enums.JobType;

  @IsString()
  @IsOptional()
  driverId?: string;
}

export class UpdateDeliveryDto {
  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  suburb?: string;

  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @IsString()
  @IsOptional()
  driverId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum($Enums.JobType)
  @IsOptional()
  jobType?: $Enums.JobType;
}

export class UpdateDeliveryStatusDto {
  @IsEnum($Enums.DeliveryStatus)
  status: $Enums.DeliveryStatus;
}

// ─── Bulk Assign ──────────────────────────────────────────────────────────────

export class BulkAssignDriverDto {
  @IsArray()
  @IsString({ each: true })
  jobIds: string[];

  @IsString()
  driverId: string;
}

// ─── Photos ───────────────────────────────────────────────────────────────────

export class AddDeliveryPhotoDto {
  @IsString()
  fileData: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsString()
  @IsOptional()
  caption?: string;
}

HEREDOC_LOGISTICS_DTO_TS

echo "  -> logistics/logistics.service.ts"
cat > "$REPO/logistics/logistics.service.ts" << 'HEREDOC_LOGISTICS_SERVICE_TS'
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

HEREDOC_LOGISTICS_SERVICE_TS

echo "  -> claims/claims.dto.ts"
cat > "$REPO/claims/claims.dto.ts" << 'HEREDOC_CLAIMS_DTO_TS'
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { $Enums } from '@prisma/client';

// ─── Re-export Prisma enums so the rest of the module imports from one place ──
// This avoids defining local enums that clash with Prisma's generated types.

export const ClaimStatus = $Enums.ClaimStatus;
export type ClaimStatus = $Enums.ClaimStatus;

export const LiabilityStatus = $Enums.LiabilityStatus;
export type LiabilityStatus = $Enums.LiabilityStatus;

export const HireType = $Enums.HireType;
export type HireType = $Enums.HireType;

export const TypeOfCover = $Enums.TypeOfCover;
export type TypeOfCover = $Enums.TypeOfCover;

// DocumentType is only used for claim documents — not a Prisma enum
export enum DocumentType {
  POLICE_REPORT = 'POLICE_REPORT',
  REPAIR_QUOTE = 'REPAIR_QUOTE',
  INVOICE = 'INVOICE',
  PHOTO = 'PHOTO',
  OTHER = 'OTHER',
}

// ─── Claim ───────────────────────────────────────────────────────────────────

export class CreateClaimDto {
  @IsString()
  reservationId: string;

  @IsString()
  @IsOptional()
  insurerId?: string;

  @IsString()
  @IsOptional()
  repairerId?: string;

  @IsString()
  @IsOptional()
  claimReference?: string;

  @IsString()
  @IsOptional()
  claimHandlerName?: string;

  @IsString()
  @IsOptional()
  claimHandlerPhone?: string;

  @IsEmail()
  @IsOptional()
  claimHandlerEmail?: string;

  @IsString()
  @IsOptional()
  sourceOfBusiness?: string;

  @IsEnum($Enums.HireType)
  @IsOptional()
  hireType?: $Enums.HireType;

  @IsEnum($Enums.TypeOfCover)
  @IsOptional()
  typeOfCover?: $Enums.TypeOfCover;

  @IsString()
  @IsOptional()
  policyNumber?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  excessAmount?: number;

  @IsEnum($Enums.LiabilityStatus)
  @IsOptional()
  liabilityStatus?: $Enums.LiabilityStatus;

  @IsString()
  @IsOptional()
  liabilityNotes?: string;

  @IsBoolean()
  @IsOptional()
  totalLoss?: boolean;

  @IsBoolean()
  @IsOptional()
  towIn?: boolean;

  @IsBoolean()
  @IsOptional()
  settlementReceived?: boolean;

  @IsBoolean()
  @IsOptional()
  isDriverOwner?: boolean;

  @IsEnum($Enums.ClaimStatus)
  @IsOptional()
  status?: $Enums.ClaimStatus;
}

export class UpdateClaimDto {
  @IsEnum($Enums.ClaimStatus)
  @IsOptional()
  status?: $Enums.ClaimStatus;

  @IsString()
  @IsOptional()
  claimNumber?: string;

  @IsString()
  @IsOptional()
  claimReference?: string;

  @IsString()
  @IsOptional()
  claimHandlerName?: string;

  @IsString()
  @IsOptional()
  claimHandlerPhone?: string;

  @IsEmail()
  @IsOptional()
  claimHandlerEmail?: string;

  @IsString()
  @IsOptional()
  sourceOfBusiness?: string;

  @IsEnum($Enums.HireType)
  @IsOptional()
  hireType?: $Enums.HireType;

  @IsEnum($Enums.TypeOfCover)
  @IsOptional()
  typeOfCover?: $Enums.TypeOfCover;

  @IsString()
  @IsOptional()
  policyNumber?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  excessAmount?: number;

  @IsEnum($Enums.LiabilityStatus)
  @IsOptional()
  liabilityStatus?: $Enums.LiabilityStatus;

  @IsString()
  @IsOptional()
  liabilityNotes?: string;

  @IsBoolean()
  @IsOptional()
  totalLoss?: boolean;

  @IsBoolean()
  @IsOptional()
  towIn?: boolean;

  @IsBoolean()
  @IsOptional()
  settlementReceived?: boolean;

  @IsBoolean()
  @IsOptional()
  isDriverOwner?: boolean;

  @IsString()
  @IsOptional()
  insurerId?: string;

  @IsString()
  @IsOptional()
  repairerId?: string;
}

// ─── Accident Details ─────────────────────────────────────────────────────────

export class UpsertAccidentDetailsDto {
  @IsString() @IsOptional() accidentDate?: string;
  @IsString() @IsOptional() accidentTime?: string;
  @IsString() @IsOptional() accidentLocation?: string;
  @IsString() @IsOptional() accidentDescription?: string;
  @IsBoolean() @IsOptional() policeAttended?: boolean;
  @IsString() @IsOptional() policeEventNo?: string;
  @IsString() @IsOptional() policeStation?: string;
  @IsString() @IsOptional() policeContactName?: string;
  @IsString() @IsOptional() policePhone?: string;
  @IsString() @IsOptional() witnessName?: string;
  @IsString() @IsOptional() witnessPhone?: string;
  @IsString() @IsOptional() witnessStatement?: string;
}

// ─── At Fault Party ───────────────────────────────────────────────────────────

export class UpsertAtFaultPartyDto {
  @IsString() @IsOptional() firstName?: string;
  @IsString() @IsOptional() lastName?: string;
  @IsString() @IsOptional() phone?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() dateOfBirth?: string;
  @IsString() @IsOptional() streetAddress?: string;
  @IsString() @IsOptional() suburb?: string;
  @IsString() @IsOptional() state?: string;
  @IsString() @IsOptional() postcode?: string;
  @IsString() @IsOptional() licenceNumber?: string;
  @IsString() @IsOptional() licenceState?: string;
  @IsString() @IsOptional() licenceExpiry?: string;
  @IsString() @IsOptional() vehicleRego?: string;
  @IsString() @IsOptional() vehicleMake?: string;
  @IsString() @IsOptional() vehicleModel?: string;
  @IsNumber() @IsOptional() @Type(() => Number) vehicleYear?: number;
  @IsString() @IsOptional() vehicleColour?: string;
  @IsString() @IsOptional() theirInsurer?: string;
  @IsString() @IsOptional() theirPolicyNo?: string;
  @IsString() @IsOptional() theirClaimNo?: string;
  @IsString() @IsOptional() companyName?: string;
  @IsString() @IsOptional() companyABN?: string;
  @IsString() @IsOptional() companyPhone?: string;
}

// ─── Repair Details ───────────────────────────────────────────────────────────

export class UpsertRepairDetailsDto {
  @IsString() @IsOptional() estimateDate?: string;
  @IsString() @IsOptional() assessmentDate?: string;
  @IsString() @IsOptional() repairStartDate?: string;
  @IsString() @IsOptional() repairEndDate?: string;
  @IsString() @IsOptional() invoiceNumber?: string;
  @IsNumber() @IsOptional() @Type(() => Number) invoiceAmount?: number;
  @IsNumber() @IsOptional() @Type(() => Number) authorisedAmount?: number;
  @IsBoolean() @IsOptional() thirdPartyRecovery?: boolean;
  @IsNumber() @IsOptional() @Type(() => Number) recoveryAmount?: number;
  @IsString() @IsOptional() repairNotes?: string;
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export class AddNoteDto {
  @IsString() note: string;
  @IsString() authorName: string;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export class AddClaimDocumentDto {
  @IsString() name: string;
  @IsString() url: string;
  @IsEnum(DocumentType) @IsOptional() type?: DocumentType;
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export class CreateInvoiceDto {
  @IsNumber() @Type(() => Number) amount: number;
  @IsString() @IsOptional() dueDate?: string;
  @IsString() @IsOptional() notes?: string;
}

// ─── Insurers ─────────────────────────────────────────────────────────────────
// Prisma's Insurer model requires `code` as well as `name`.

export class CreateInsurerDto {
  @IsString() name: string;
  @IsString() code: string;
  @IsString() @IsOptional() phone?: string;
  @IsEmail() @IsOptional() email?: string;
}

// ─── Repairers ────────────────────────────────────────────────────────────────
// Prisma's Repairer model requires `phone` — it is required here too.

export class CreateRepairerDto {
  @IsString() name: string;
  @IsString() phone: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() suburb?: string;
}

export class UpdateRepairerDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() phone?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() suburb?: string;
  @IsString() @IsOptional() postcode?: string;
  @IsString() @IsOptional() state?: string;
  @IsString() @IsOptional() territory?: string;
  @IsString() @IsOptional() branchId?: string;
  @IsString() @IsOptional() paymentType?: string;
  @IsString() @IsOptional() bsb?: string;
  @IsString() @IsOptional() accountNumber?: string;
  @IsString() @IsOptional() accountName?: string;
  @IsString() @IsOptional() bankName?: string;
  @IsNumber() @IsOptional() @Type(() => Number) referralAmount?: number;
  @IsString() @IsOptional() paymentFrequency?: string;
}

HEREDOC_CLAIMS_DTO_TS

echo "  -> claims/claims.service.ts"
cat > "$REPO/claims/claims.service.ts" << 'HEREDOC_CLAIMS_SERVICE_TS'
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { $Enums, Claim, ClaimDocument, ClaimNote, Invoice, Insurer, Repairer, RepairerDocument, AccidentDetails, AtFaultParty, RepairDetails } from '@prisma/client';
import {
  CreateClaimDto,
  UpdateClaimDto,
  UpsertAccidentDetailsDto,
  UpsertAtFaultPartyDto,
  UpsertRepairDetailsDto,
  AddNoteDto,
  AddClaimDocumentDto,
  CreateInvoiceDto,
  CreateInsurerDto,
  CreateRepairerDto,
  UpdateRepairerDto,
} from './claims.dto';

@Injectable()
export class ClaimsService {
  private readonly logger = new Logger(ClaimsService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  // ─── LIST ────────────────────────────────────────────────────────────────────

  async findAll(branchId?: string): Promise<Claim[]> {
    const claims = await this.prisma.claim.findMany({
      include: {
        reservation: {
          include: {
            customer: true,
            vehicle: { include: { branch: true } },
          },
        },
        insurer: true,
        repairer: true,
        notes: { orderBy: { createdAt: 'desc' } },
        accidentDetails: true,
        repairDetails: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!branchId) return claims;
    return claims.filter(
      (c) => c.reservation?.vehicle?.branch?.id === branchId,
    );
  }

  // ─── SINGLE ──────────────────────────────────────────────────────────────────

  findOne(id: string): Promise<Claim | null> {
    return this.prisma.claim.findUnique({
      where: { id },
      include: {
        reservation: {
          include: {
            customer: true,
            vehicle: { include: { branch: true } },
          },
        },
        insurer: true,
        repairer: true,
        accidentDetails: true,
        atFaultParty: true,
        repairDetails: true,
        notes: { orderBy: { createdAt: 'desc' } },
        documents: true,
        invoices: true,
      },
    });
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────────

  async create(data: CreateClaimDto): Promise<Claim> {
    const count = await this.prisma.claim.count();
    const claimNumber = `CLM-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.claim.create({
      data: {
        reservation: { connect: { id: data.reservationId } },
        insurer: data.insurerId ? { connect: { id: data.insurerId } } : undefined,
        repairer: data.repairerId ? { connect: { id: data.repairerId } } : undefined,
        claimNumber,
        claimReference: data.claimReference ?? null,
        claimHandlerName: data.claimHandlerName ?? null,
        claimHandlerPhone: data.claimHandlerPhone ?? null,
        claimHandlerEmail: data.claimHandlerEmail ?? null,
        sourceOfBusiness: data.sourceOfBusiness ?? null,
        // hireType and typeOfCover are Prisma enums — pass through directly (already typed)
        hireType: data.hireType ?? null,
        typeOfCover: data.typeOfCover ?? null,
        policyNumber: data.policyNumber ?? null,
        excessAmount: data.excessAmount ?? null,
        liabilityStatus: data.liabilityStatus ?? $Enums.LiabilityStatus.PENDING,
        liabilityNotes: data.liabilityNotes ?? null,
        totalLoss: data.totalLoss ?? false,
        towIn: data.towIn ?? false,
        settlementReceived: data.settlementReceived ?? false,
        isDriverOwner: data.isDriverOwner ?? true,
        status: data.status ?? $Enums.ClaimStatus.OPEN,
      },
      include: {
        reservation: { include: { customer: true, vehicle: true } },
        insurer: true,
        repairer: true,
        notes: true,
        accidentDetails: true,
        atFaultParty: true,
        repairDetails: true,
      },
    });
  }

  // ─── UPDATE CORE CLAIM ───────────────────────────────────────────────────────

  update(id: string, data: UpdateClaimDto): Promise<Claim> {
    return this.prisma.claim.update({
      where: { id },
      data: {
        // status, hireType, typeOfCover, liabilityStatus are all Prisma enums
        // passed as the correct type from the DTO — no cast needed
        status: data.status,
        claimNumber: data.claimNumber,
        claimReference: data.claimReference,
        claimHandlerName: data.claimHandlerName,
        claimHandlerPhone: data.claimHandlerPhone,
        claimHandlerEmail: data.claimHandlerEmail,
        sourceOfBusiness: data.sourceOfBusiness,
        hireType: data.hireType ?? undefined,
        typeOfCover: data.typeOfCover ?? undefined,
        policyNumber: data.policyNumber,
        excessAmount: data.excessAmount ?? undefined,
        liabilityStatus: data.liabilityStatus ?? undefined,
        liabilityNotes: data.liabilityNotes,
        totalLoss: data.totalLoss,
        towIn: data.towIn,
        settlementReceived: data.settlementReceived,
        isDriverOwner: data.isDriverOwner,
        insurer: data.insurerId ? { connect: { id: data.insurerId } } : undefined,
        repairer: data.repairerId ? { connect: { id: data.repairerId } } : undefined,
      },
      include: {
        reservation: { include: { customer: true, vehicle: true } },
        insurer: true,
        repairer: true,
        accidentDetails: true,
        atFaultParty: true,
        repairDetails: true,
        notes: { orderBy: { createdAt: 'desc' } },
        documents: true,
        invoices: true,
      },
    });
  }

  // ─── ACCIDENT DETAILS ────────────────────────────────────────────────────────

  upsertAccidentDetails(claimId: string, data: UpsertAccidentDetailsDto): Promise<AccidentDetails> {
    const payload = {
      accidentDate: data.accidentDate ? new Date(data.accidentDate) : null,
      accidentTime: data.accidentTime ?? null,
      accidentLocation: data.accidentLocation ?? null,
      accidentDescription: data.accidentDescription ?? null,
      policeAttended: data.policeAttended ?? false,
      policeEventNo: data.policeEventNo ?? null,
      policeStation: data.policeStation ?? null,
      policeContactName: data.policeContactName ?? null,
      policePhone: data.policePhone ?? null,
      witnessName: data.witnessName ?? null,
      witnessPhone: data.witnessPhone ?? null,
      witnessStatement: data.witnessStatement ?? null,
    };
    return this.prisma.accidentDetails.upsert({
      where: { claimId },
      create: { claim: { connect: { id: claimId } }, ...payload },
      update: payload,
    });
  }

  // ─── AT FAULT PARTY ──────────────────────────────────────────────────────────

  upsertAtFaultParty(claimId: string, data: UpsertAtFaultPartyDto): Promise<AtFaultParty> {
    const payload = {
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      dateOfBirth: data.dateOfBirth ?? null,
      streetAddress: data.streetAddress ?? null,
      suburb: data.suburb ?? null,
      state: data.state ?? null,
      postcode: data.postcode ?? null,
      licenceNumber: data.licenceNumber ?? null,
      licenceState: data.licenceState ?? null,
      licenceExpiry: data.licenceExpiry ?? null,
      vehicleRego: data.vehicleRego ?? null,
      vehicleMake: data.vehicleMake ?? null,
      vehicleModel: data.vehicleModel ?? null,
      vehicleYear: data.vehicleYear ?? null,
      vehicleColour: data.vehicleColour ?? null,
      theirInsurer: data.theirInsurer ?? null,
      theirPolicyNo: data.theirPolicyNo ?? null,
      theirClaimNo: data.theirClaimNo ?? null,
      companyName: data.companyName ?? null,
      companyABN: data.companyABN ?? null,
      companyPhone: data.companyPhone ?? null,
    };
    return this.prisma.atFaultParty.upsert({
      where: { claimId },
      create: { claim: { connect: { id: claimId } }, ...payload },
      update: payload,
    });
  }

  // ─── REPAIR DETAILS ──────────────────────────────────────────────────────────

  upsertRepairDetails(claimId: string, data: UpsertRepairDetailsDto): Promise<RepairDetails> {
    const payload = {
      estimateDate: data.estimateDate ? new Date(data.estimateDate) : null,
      assessmentDate: data.assessmentDate ? new Date(data.assessmentDate) : null,
      repairStartDate: data.repairStartDate ? new Date(data.repairStartDate) : null,
      repairEndDate: data.repairEndDate ? new Date(data.repairEndDate) : null,
      invoiceNumber: data.invoiceNumber ?? null,
      invoiceAmount: data.invoiceAmount ?? null,
      authorisedAmount: data.authorisedAmount ?? null,
      thirdPartyRecovery: data.thirdPartyRecovery ?? false,
      recoveryAmount: data.recoveryAmount ?? null,
      repairNotes: data.repairNotes ?? null,
    };
    return this.prisma.repairDetails.upsert({
      where: { claimId },
      create: { claim: { connect: { id: claimId } }, ...payload },
      update: payload,
    });
  }

  // ─── NOTES ───────────────────────────────────────────────────────────────────

  addNote(claimId: string, data: AddNoteDto): Promise<ClaimNote> {
    return this.prisma.claimNote.create({
      data: {
        claim: { connect: { id: claimId } },
        note: data.note,
        authorName: data.authorName,
      },
    });
  }

  // ─── DOCUMENTS ───────────────────────────────────────────────────────────────

  addDocument(claimId: string, data: AddClaimDocumentDto): Promise<ClaimDocument> {
    return this.prisma.claimDocument.create({
      data: {
        claim: { connect: { id: claimId } },
        name: data.name,
        url: data.url,
        type: data.type ?? 'OTHER',
      },
    });
  }

  deleteDocument(documentId: string): Promise<ClaimDocument> {
    return this.prisma.claimDocument.delete({ where: { id: documentId } });
  }

  // ─── INVOICES ────────────────────────────────────────────────────────────────

  createInvoice(claimId: string, data: CreateInvoiceDto): Promise<Invoice> {
    return this.prisma.invoice.create({
      data: {
        claim: { connect: { id: claimId } },
        amount: data.amount,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes ?? null,
      },
    });
  }

  // ─── INSURERS ────────────────────────────────────────────────────────────────

  getInsurerDirectory(): Promise<Insurer[]> {
    return this.prisma.insurer.findMany({ orderBy: { name: 'asc' } });
  }

  createInsurer(data: CreateInsurerDto): Promise<Insurer> {
    return this.prisma.insurer.create({ data });
  }

  // ─── REPAIRERS ───────────────────────────────────────────────────────────────

  getRepairerDirectory(): Promise<Repairer[]> {
    return this.prisma.repairer.findMany({ orderBy: { name: 'asc' } });
  }

  createRepairer(data: CreateRepairerDto): Promise<Repairer> {
    return this.prisma.repairer.create({ data });
  }

  updateRepairer(id: string, data: UpdateRepairerDto): Promise<Repairer> {
    return this.prisma.repairer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email ?? undefined,
        address: data.address,
        suburb: data.suburb,
        postcode: data.postcode ?? undefined,
        state: data.state ?? undefined,
        territory: data.territory ?? undefined,
        branchId: data.branchId ?? undefined,
        paymentType: data.paymentType ?? undefined,
        bsb: data.bsb ?? undefined,
        accountNumber: data.accountNumber ?? undefined,
        accountName: data.accountName ?? undefined,
        bankName: data.bankName ?? undefined,
        referralAmount: data.referralAmount ?? undefined,
        paymentFrequency: data.paymentFrequency ?? undefined,
      },
    });
  }

  // ─── REPAIRER DOCUMENTS (R2) ─────────────────────────────────────────────────

  async getRepairerDocuments(repairerId: string): Promise<Omit<RepairerDocument, 'fileData'>[]> {
    const docs = await this.prisma.repairerDocument.findMany({
      where: { repairerId },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map(({ fileData, ...rest }) => rest);
  }

  async getRepairerDocumentUrl(docId: string): Promise<{ url: string } | null> {
    const doc = await this.prisma.repairerDocument.findUnique({ where: { id: docId } });
    if (!doc) return null;
    if (doc.key) {
      const url = await this.storage.getPresignedUrl(doc.key);
      return { url };
    }
    if (doc.fileData) {
      return { url: `data:${doc.mimeType};base64,${doc.fileData}` };
    }
    return null;
  }

  async addRepairerDocument(
    repairerId: string,
    name: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<RepairerDocument> {
    const ext = mimeType.split('/')[1] || 'bin';
    const key = `repairer-docs/${repairerId}/${Date.now()}-${name.replace(/\s+/g, '-')}.${ext}`;
    await this.storage.upload(key, buffer, mimeType);
    return this.prisma.repairerDocument.create({
      data: {
        repairer: { connect: { id: repairerId } },
        name,
        key,
        fileData: '',
        mimeType,
      },
    });
  }

  async deleteRepairerDocument(documentId: string): Promise<RepairerDocument> {
    const doc = await this.prisma.repairerDocument.findUnique({ where: { id: documentId } });
    if (doc?.key) {
      try {
        await this.storage.delete(doc.key);
      } catch (err) {
        this.logger.warn(`Failed to delete R2 object ${doc.key}: ${(err as Error).message}`);
      }
    }
    return this.prisma.repairerDocument.delete({ where: { id: documentId } });
  }
}

HEREDOC_CLAIMS_SERVICE_TS

echo "  -> admin/admin.dto.ts"
cat > "$REPO/admin/admin.dto.ts" << 'HEREDOC_ADMIN_DTO_TS'
import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { $Enums } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsEnum($Enums.Role)
  role: $Enums.Role;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  password?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum($Enums.Role)
  @IsOptional()
  role?: $Enums.Role;

  @IsString()
  @IsOptional()
  branchId?: string;
}

HEREDOC_ADMIN_DTO_TS

echo "  -> admin/admin.service.ts"
cat > "$REPO/admin/admin.service.ts" << 'HEREDOC_ADMIN_SERVICE_TS'
import { Injectable, Logger } from '@nestjs/common';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { $Enums } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './admin.dto';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

interface ClerkUserRecord {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
  publicMetadata: Record<string, unknown>;
  createdAt: number;
}

interface UserListItem {
  clerkId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | undefined;
  role: string;
  branch: string;
  branchId: string;
  createdAt: number;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async createUser(data: CreateUserDto): Promise<ClerkUserRecord> {
    const params: {
      firstName: string;
      lastName: string;
      emailAddress: string[];
      publicMetadata: Record<string, unknown>;
      password?: string;
      skipPasswordChecks?: boolean;
    } = {
      firstName: data.firstName,
      lastName: data.lastName,
      emailAddress: [data.email],
      publicMetadata: {
        role: data.role,
        branchId: data.branchId ?? null,
      },
    };

    if (data.password) {
      params.password = data.password;
      params.skipPasswordChecks = false;
    }

    let clerkUser: ClerkUserRecord;
    try {
      clerkUser = await clerk.users.createUser(params) as unknown as ClerkUserRecord;
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ message: string }> };
      const message = clerkErr?.errors?.[0]?.message ?? 'Failed to create user';
      throw new Error(message);
    }

    await this.prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        // data.role is already $Enums.Role — Prisma accepts it directly
        role: data.role as $Enums.Role,
        branchId: data.branchId ?? null,
      },
    });

    return clerkUser;
  }

  async updateUser(clerkId: string, data: UpdateUserDto): Promise<{ success: boolean }> {
    const branchId = data.branchId && data.branchId !== '' ? data.branchId : null;

    await clerk.users.updateUser(clerkId, {
      firstName: data.firstName,
      lastName: data.lastName,
      publicMetadata: {
        role: data.role,
        branchId,
      },
    });

    await this.prisma.user.updateMany({
      where: { clerkId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as $Enums.Role,
        branchId,
      },
    });

    return { success: true };
  }

  async deleteUser(clerkId: string): Promise<{ success: boolean }> {
    await clerk.users.deleteUser(clerkId);
    await this.prisma.user.deleteMany({ where: { clerkId } });
    return { success: true };
  }

  async listUsers(): Promise<UserListItem[]> {
    const clerkResponse = await clerk.users.getUserList({ limit: 100 });
    const dbUsers = await this.prisma.user.findMany({ include: { branch: true } });

    const clerkUsers: ClerkUserRecord[] = Array.isArray(clerkResponse)
      ? (clerkResponse as unknown as ClerkUserRecord[])
      : ((clerkResponse as unknown as { data: ClerkUserRecord[] }).data ?? []);

    return clerkUsers.map((cu) => {
      const dbUser = dbUsers.find((u) => u.clerkId === cu.id);
      return {
        clerkId: cu.id,
        firstName: cu.firstName,
        lastName: cu.lastName,
        email: cu.emailAddresses[0]?.emailAddress,
        role: (cu.publicMetadata?.role as string) ?? 'No role',
        branch: dbUser?.branch?.name ?? '—',
        branchId: dbUser?.branchId ?? '',
        createdAt: cu.createdAt,
      };
    });
  }
}

HEREDOC_ADMIN_SERVICE_TS

echo ""
echo "Done. Now run:"
echo "  cd ~/rentpro/apps/api && npx tsc --noEmit"