#!/bin/bash
set -e
REPO="$HOME/rentpro/apps/api/src"
echo "Writing refactored files into $REPO ..."

echo "  -> fleet/fleet.service.ts"
mkdir -p "$REPO/fleet"
cat > "$REPO/fleet/fleet.service.ts" << 'HEREDOC_FLEET_SERVICE_TS'
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Vehicle, VehiclePhoto } from '@prisma/client';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  UpdateVehicleStatusDto,
  AddPhotoDto,
  VehicleStatus,
} from './fleet.dto';

// Shape returned by findOne — vehicle with presigned photo URLs resolved
type VehicleWithPhotos = Omit<Vehicle, never> & {
  photos: (VehiclePhoto & { url: string })[];
};

// Shape returned by getFleetSummary
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

  // ─── LIST ─────────────────────────────────────────────────────────────────

  findAll(branchId?: string): Promise<Vehicle[]> {
    const isBranchFiltered =
      branchId && branchId !== 'null' && branchId !== 'all';

    return this.prisma.vehicle.findMany({
      where: isBranchFiltered ? { branchId } : undefined,
      include: { branch: true, photos: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── SINGLE ───────────────────────────────────────────────────────────────

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

  // ─── CREATE ───────────────────────────────────────────────────────────────

  create(data: CreateVehicleDto): Promise<Vehicle> {
    const { branchId, ...rest } = data;
    return this.prisma.vehicle.create({
      data: {
        ...rest,
        ...(branchId ? { branch: { connect: { id: branchId } } } : {}),
      },
      include: { branch: true },
    });
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  update(id: string, data: UpdateVehicleDto): Promise<Vehicle> {
    return this.prisma.vehicle.update({
      where: { id },
      data,
      include: { branch: true },
    });
  }

  // ─── UPDATE STATUS ────────────────────────────────────────────────────────

  updateStatus(id: string, data: UpdateVehicleStatusDto): Promise<Vehicle> {
    // data.status is already a validated VehicleStatus enum — no cast needed
    return this.prisma.vehicle.update({
      where: { id },
      data: { status: data.status },
      include: { branch: true },
    });
  }

  // ─── FLEET SUMMARY ────────────────────────────────────────────────────────

  async getFleetSummary(branchId?: string): Promise<FleetSummary> {
    const isBranchFiltered =
      branchId && branchId !== 'null' && branchId !== 'all';

    const vehicles = await this.prisma.vehicle.findMany({
      where: isBranchFiltered ? { branchId } : undefined,
    });

    return {
      total: vehicles.length,
      available: vehicles.filter((v) => v.status === VehicleStatus.AVAILABLE).length,
      onHire: vehicles.filter((v) => v.status === VehicleStatus.ON_HIRE).length,
      inRepair: vehicles.filter(
        (v) =>
          v.status === VehicleStatus.IN_REPAIR ||
          v.status === VehicleStatus.BOOKED_FOR_REPAIR,
      ).length,
      inService: vehicles.filter(
        (v) =>
          v.status === VehicleStatus.IN_SERVICE ||
          v.status === VehicleStatus.BOOKED_FOR_SERVICE,
      ).length,
      notAvailable: vehicles.filter(
        (v) =>
          v.status === VehicleStatus.NOT_AVAILABLE ||
          v.status === VehicleStatus.WITH_STAFF ||
          v.status === VehicleStatus.CLEAN_NEEDED ||
          v.status === VehicleStatus.RESERVED_FOR_TRANSPORT,
      ).length,
    };
  }

  // ─── PHOTOS ───────────────────────────────────────────────────────────────

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
        // Non-fatal — log and continue so the DB record is still cleaned up
        this.logger.warn(
          `Failed to delete R2 object ${photo.key}: ${(err as Error).message}`,
        );
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

echo "  -> fleet/fleet.dto.ts"
mkdir -p "$REPO/fleet"
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

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  ON_HIRE = 'ON_HIRE',
  IN_REPAIR = 'IN_REPAIR',
  BOOKED_FOR_REPAIR = 'BOOKED_FOR_REPAIR',
  IN_SERVICE = 'IN_SERVICE',
  BOOKED_FOR_SERVICE = 'BOOKED_FOR_SERVICE',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  WITH_STAFF = 'WITH_STAFF',
  CLEAN_NEEDED = 'CLEAN_NEEDED',
  RESERVED_FOR_TRANSPORT = 'RESERVED_FOR_TRANSPORT',
}

// ─── Vehicle CRUD ─────────────────────────────────────────────────────────────

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

  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;

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

  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;

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
  @IsEnum(VehicleStatus)
  status: VehicleStatus;
}

// ─── Photos ───────────────────────────────────────────────────────────────────

export class AddPhotoDto {
  /** Base64-encoded file content */
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

echo "  -> logistics/logistics.service.ts"
mkdir -p "$REPO/logistics"
cat > "$REPO/logistics/logistics.service.ts" << 'HEREDOC_LOGISTICS_SERVICE_TS'
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Delivery, DeliveryPhoto } from '@prisma/client';
import {
  CreateDeliveryDto,
  UpdateDeliveryDto,
  UpdateDeliveryStatusDto,
  AddDeliveryPhotoDto,
  DeliveryStatus,
} from './logistics.dto';

// Reusable include shape — keeps all the findMany/update calls consistent
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

// Helper: returns a Prisma where clause for branch filtering
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

  // ─── LIST ─────────────────────────────────────────────────────────────────

  findAll(branchId?: string): Promise<Delivery[]> {
    return this.prisma.delivery.findMany({
      where: branchFilter(branchId),
      include: DELIVERY_INCLUDE,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  // ─── TODAY ────────────────────────────────────────────────────────────────

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

  // ─── SINGLE ───────────────────────────────────────────────────────────────

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

  // ─── CREATE ───────────────────────────────────────────────────────────────

  create(data: CreateDeliveryDto): Promise<Delivery> {
    return this.prisma.delivery.create({
      data: {
        reservation: { connect: { id: data.reservationId } },
        address: data.address,
        suburb: data.suburb,
        scheduledAt: new Date(data.scheduledAt),
        notes: data.notes ?? null,
        status: DeliveryStatus.SCHEDULED,
        jobType: data.jobType ?? 'DELIVERY',
        ...(data.driverId ? { driver: { connect: { id: data.driverId } } } : {}),
      },
      include: DELIVERY_INCLUDE,
    });
  }

  // ─── UPDATE STATUS ────────────────────────────────────────────────────────

  async updateStatus(id: string, data: UpdateDeliveryStatusDto): Promise<Delivery> {
    const delivery = await this.prisma.delivery.findUnique({ where: { id } });
    if (!delivery) throw new NotFoundException('Delivery not found');

    return this.prisma.delivery.update({
      where: { id },
      data: {
        status: data.status,
        // Only stamp deliveredAt when transitioning to DELIVERED
        deliveredAt: data.status === DeliveryStatus.DELIVERED ? new Date() : undefined,
      },
      include: DELIVERY_INCLUDE,
    });
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  update(id: string, data: UpdateDeliveryDto): Promise<Delivery> {
    return this.prisma.delivery.update({
      where: { id },
      data: {
        address: data.address,
        suburb: data.suburb,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        driverId: data.driverId !== undefined ? data.driverId : undefined,
        notes: data.notes,
        jobType: data.jobType ?? undefined,
      },
      include: DELIVERY_INCLUDE,
    });
  }

  // ─── BULK ASSIGN DRIVER ───────────────────────────────────────────────────

  async bulkAssignDriver(jobIds: string[], driverId: string): Promise<{ updated: number }> {
    await this.prisma.delivery.updateMany({
      where: { id: { in: jobIds } },
      data: { driverId },
    });
    return { updated: jobIds.length };
  }

  // ─── PHOTOS ───────────────────────────────────────────────────────────────

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
        this.logger.warn(
          `Failed to delete R2 object ${photo.key}: ${(err as Error).message}`,
        );
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

echo "  -> logistics/logistics.dto.ts"
mkdir -p "$REPO/logistics"
cat > "$REPO/logistics/logistics.dto.ts" << 'HEREDOC_LOGISTICS_DTO_TS'
import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum DeliveryStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum JobType {
  DELIVERY = 'DELIVERY',
  COLLECTION = 'COLLECTION',
  SWAP = 'SWAP',
  TRANSPORT = 'TRANSPORT',
}

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

  @IsEnum(JobType)
  @IsOptional()
  jobType?: JobType;

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

  @IsEnum(JobType)
  @IsOptional()
  jobType?: JobType;
}

export class UpdateDeliveryStatusDto {
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;
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

echo "  -> claims/claims.service.ts"
mkdir -p "$REPO/claims"
cat > "$REPO/claims/claims.service.ts" << 'HEREDOC_CLAIMS_SERVICE_TS'
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Claim, ClaimDocument, ClaimNote, Invoice, Insurer, Repairer, RepairerDocument, AccidentDetails, AtFaultParty, RepairDetails } from '@prisma/client';
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
        hireType: data.hireType ?? null,
        typeOfCover: data.typeOfCover ?? null,
        policyNumber: data.policyNumber ?? null,
        excessAmount: data.excessAmount ?? null,
        liabilityStatus: data.liabilityStatus ?? 'PENDING',
        liabilityNotes: data.liabilityNotes ?? null,
        totalLoss: data.totalLoss ?? false,
        towIn: data.towIn ?? false,
        settlementReceived: data.settlementReceived ?? false,
        isDriverOwner: data.isDriverOwner ?? true,
        status: data.status ?? 'OPEN',
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
    const doc = await this.prisma.repairerDocument.findUnique({
      where: { id: docId },
    });
    if (!doc) return null;

    if (doc.key) {
      const url = await this.storage.getPresignedUrl(doc.key);
      return { url };
    }

    // Legacy fallback: doc still has base64 fileData
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
    const doc = await this.prisma.repairerDocument.findUnique({
      where: { id: documentId },
    });

    if (doc?.key) {
      try {
        await this.storage.delete(doc.key);
      } catch (err) {
        // Non-fatal — log and continue so the DB record is still cleaned up
        this.logger.warn(`Failed to delete R2 object ${doc.key}: ${(err as Error).message}`);
      }
    }

    return this.prisma.repairerDocument.delete({ where: { id: documentId } });
  }
}

HEREDOC_CLAIMS_SERVICE_TS

echo "  -> claims/claims.dto.ts"
mkdir -p "$REPO/claims"
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

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ClaimStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
  DECLINED = 'DECLINED',
}

export enum LiabilityStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DISPUTED = 'DISPUTED',
  DENIED = 'DENIED',
}

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

  @IsString()
  @IsOptional()
  hireType?: string;

  @IsString()
  @IsOptional()
  typeOfCover?: string;

  @IsString()
  @IsOptional()
  policyNumber?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  excessAmount?: number;

  @IsEnum(LiabilityStatus)
  @IsOptional()
  liabilityStatus?: LiabilityStatus;

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

  @IsEnum(ClaimStatus)
  @IsOptional()
  status?: ClaimStatus;
}

export class UpdateClaimDto {
  @IsEnum(ClaimStatus)
  @IsOptional()
  status?: ClaimStatus;

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

  @IsString()
  @IsOptional()
  hireType?: string;

  @IsString()
  @IsOptional()
  typeOfCover?: string;

  @IsString()
  @IsOptional()
  policyNumber?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  excessAmount?: number;

  @IsEnum(LiabilityStatus)
  @IsOptional()
  liabilityStatus?: LiabilityStatus;

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
  @IsString()
  @IsOptional()
  accidentDate?: string;

  @IsString()
  @IsOptional()
  accidentTime?: string;

  @IsString()
  @IsOptional()
  accidentLocation?: string;

  @IsString()
  @IsOptional()
  accidentDescription?: string;

  @IsBoolean()
  @IsOptional()
  policeAttended?: boolean;

  @IsString()
  @IsOptional()
  policeEventNo?: string;

  @IsString()
  @IsOptional()
  policeStation?: string;

  @IsString()
  @IsOptional()
  policeContactName?: string;

  @IsString()
  @IsOptional()
  policePhone?: string;

  @IsString()
  @IsOptional()
  witnessName?: string;

  @IsString()
  @IsOptional()
  witnessPhone?: string;

  @IsString()
  @IsOptional()
  witnessStatement?: string;
}

// ─── At Fault Party ───────────────────────────────────────────────────────────

export class UpsertAtFaultPartyDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  streetAddress?: string;

  @IsString()
  @IsOptional()
  suburb?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  postcode?: string;

  @IsString()
  @IsOptional()
  licenceNumber?: string;

  @IsString()
  @IsOptional()
  licenceState?: string;

  @IsString()
  @IsOptional()
  licenceExpiry?: string;

  @IsString()
  @IsOptional()
  vehicleRego?: string;

  @IsString()
  @IsOptional()
  vehicleMake?: string;

  @IsString()
  @IsOptional()
  vehicleModel?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  vehicleYear?: number;

  @IsString()
  @IsOptional()
  vehicleColour?: string;

  @IsString()
  @IsOptional()
  theirInsurer?: string;

  @IsString()
  @IsOptional()
  theirPolicyNo?: string;

  @IsString()
  @IsOptional()
  theirClaimNo?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  companyABN?: string;

  @IsString()
  @IsOptional()
  companyPhone?: string;
}

// ─── Repair Details ───────────────────────────────────────────────────────────

export class UpsertRepairDetailsDto {
  @IsString()
  @IsOptional()
  estimateDate?: string;

  @IsString()
  @IsOptional()
  assessmentDate?: string;

  @IsString()
  @IsOptional()
  repairStartDate?: string;

  @IsString()
  @IsOptional()
  repairEndDate?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  invoiceAmount?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  authorisedAmount?: number;

  @IsBoolean()
  @IsOptional()
  thirdPartyRecovery?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  recoveryAmount?: number;

  @IsString()
  @IsOptional()
  repairNotes?: string;
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export class AddNoteDto {
  @IsString()
  note: string;

  @IsString()
  authorName: string;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export class AddClaimDocumentDto {
  @IsString()
  name: string;

  @IsString()
  url: string;

  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export class CreateInvoiceDto {
  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// ─── Insurers / Repairers ─────────────────────────────────────────────────────

export class CreateInsurerDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

export class CreateRepairerDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  suburb?: string;
}

export class UpdateRepairerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  suburb?: string;

  @IsString()
  @IsOptional()
  postcode?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  territory?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  paymentType?: string;

  @IsString()
  @IsOptional()
  bsb?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  accountName?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  referralAmount?: number;

  @IsString()
  @IsOptional()
  paymentFrequency?: string;
}

HEREDOC_CLAIMS_DTO_TS

echo "  -> admin/admin.service.ts"
mkdir -p "$REPO/admin"
cat > "$REPO/admin/admin.service.ts" << 'HEREDOC_ADMIN_SERVICE_TS'
import { Injectable, Logger } from '@nestjs/common';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './admin.dto';

// Initialised once at module load — safe because CLERK_SECRET_KEY is set before bootstrap()
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Minimal shape we need from the Clerk user object
interface ClerkUserRecord {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
  publicMetadata: Record<string, unknown>;
  createdAt: number;
}

// What listUsers() returns to callers
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
        role: data.role,
        branchId: data.branchId ?? null,
      },
    });

    return clerkUser;
  }

  async updateUser(clerkId: string, data: UpdateUserDto): Promise<{ success: boolean }> {
    // Treat empty string as null for branchId
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
        role: data.role,
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

    // Clerk SDK returns either an array or a paginated response object
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

echo "  -> admin/admin.dto.ts"
mkdir -p "$REPO/admin"
cat > "$REPO/admin/admin.dto.ts" << 'HEREDOC_ADMIN_DTO_TS'
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  role: string;

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

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  branchId?: string;
}

HEREDOC_ADMIN_DTO_TS

echo "  -> documents/documents.service.ts"
mkdir -p "$REPO/documents"
cat > "$REPO/documents/documents.service.ts" << 'HEREDOC_DOCUMENTS_SERVICE_TS'
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { PDFDocument } from 'pdf-lib';
import { DocumentTemplate, SignatureRecord } from '@prisma/client';
import { SaveSignatureDto } from './documents.dto';

type TemplateWithoutUrl = Omit<DocumentTemplate, 'url'>;

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async getTemplates(): Promise<TemplateWithoutUrl[]> {
    const templates = await this.prisma.documentTemplate.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
    // Strip the raw url field — frontend must request a presigned URL separately
    return templates.map(({ url, ...rest }) => rest);
  }

  async getTemplate(type: string): Promise<TemplateWithoutUrl | null> {
    const template = await this.prisma.documentTemplate.findUnique({ where: { type } });
    if (!template) return null;
    const { url, ...rest } = template;
    return rest;
  }

  async getTemplateUrl(type: string): Promise<{ url: string } | null> {
    const template = await this.prisma.documentTemplate.findUnique({ where: { type } });
    if (!template?.key) return null;
    const url = await this.storage.getPresignedUrl(template.key);
    return { url };
  }

  async upsertTemplate(
    type: string,
    name: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<DocumentTemplate> {
    const ext = mimeType === 'application/pdf' ? 'pdf' : 'bin';
    const key = `document-templates/${type}-${Date.now()}.${ext}`;

    await this.storage.upload(key, buffer, mimeType);

    // Clean up old R2 object if one exists
    const existing = await this.prisma.documentTemplate.findUnique({ where: { type } });
    if (existing?.key && existing.key !== key) {
      try {
        await this.storage.delete(existing.key);
      } catch (err) {
        this.logger.warn(`Failed to delete old template ${existing.key}: ${(err as Error).message}`);
      }
    }

    return this.prisma.documentTemplate.upsert({
      where: { type },
      update: {
        name,
        key,
        url: key, // keep url col populated with key for backwards compat
        updatedAt: new Date(),
      },
      create: { type, name, key, url: key },
    });
  }

  async saveSignature(reservationId: string, data: SaveSignatureDto): Promise<SignatureRecord> {
    return this.prisma.signatureRecord.upsert({
      where: { reservationId },
      update: {
        signatureData: data.signatureData,
        signingMethod: data.signingMethod,
        signedAt: new Date(),
      },
      create: {
        reservation: { connect: { id: reservationId } },
        signatureData: data.signatureData,
        signingMethod: data.signingMethod,
      },
    });
  }

  async getSignature(reservationId: string): Promise<SignatureRecord | null> {
    return this.prisma.signatureRecord.findUnique({ where: { reservationId } });
  }

  async generateHireDocs(reservationId: string): Promise<{ authorityBase64: string; rentalBase64: string }> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { customer: true, vehicle: { include: { branch: true } } },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');

    const [authorityTemplate, rentalTemplate] = await Promise.all([
      this.prisma.documentTemplate.findUnique({ where: { type: 'authority-to-act' } }),
      this.prisma.documentTemplate.findUnique({ where: { type: 'rental-agreement' } }),
    ]);
    if (!authorityTemplate) throw new NotFoundException('Authority to Act template not found');
    if (!rentalTemplate) throw new NotFoundException('Rental Agreement template not found');

    const [authorityBytes, rentalBytes] = await Promise.all([
      this.storage.getBuffer(authorityTemplate.key),
      this.storage.getBuffer(rentalTemplate.key),
    ]);

    const c = reservation.customer;
    const v = reservation.vehicle;
    const today = new Date().toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const startDate = reservation.startDate
      ? new Date(reservation.startDate).toLocaleDateString('en-AU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : today;

    const fieldValues: Record<string, string> = {
      customer_full_name:   `${c.firstName} ${c.lastName}`,
      customer_address:     c.address ?? '',
      customer_suburb:      c.suburb ?? '',
      customer_state:       c.state ?? '',
      customer_postcode:    c.postcode ?? '',
      customer_phone:       c.phone ?? '',
      customer_email:       c.email ?? '',
      customer_licence:     c.licenceNumber ?? '',
      customer_dob:         c.dob ?? '',
      vehicle_make_model:   v ? `${v.make} ${v.model}` : '',
      vehicle_registration: v?.registration ?? '',
      vehicle_colour:       v?.colour ?? '',
      vehicle_year:         v?.year ? String(v.year) : '',
      vehicle_category:     v?.category ?? '',
      hire_start_date:      startDate,
      file_number:          reservation.fileNumber ?? reservation.reservationNumber ?? '',
      reservation_number:   reservation.reservationNumber ?? '',
      sign_date:            today,
    };

    const fillPdf = async (bytes: Buffer): Promise<string> => {
      const pdfDoc = await PDFDocument.load(bytes);
      const form = pdfDoc.getForm();
      for (const [fieldName, value] of Object.entries(fieldValues)) {
        try {
          const field = form.getTextField(fieldName);
          if (field) field.setText(value);
        } catch {
          // Field not present in this template — skip silently
        }
      }
      const filledBytes = await pdfDoc.save();
      return Buffer.from(filledBytes).toString('base64');
    };

    const [authorityBase64, rentalBase64] = await Promise.all([
      fillPdf(authorityBytes),
      fillPdf(rentalBytes),
    ]);

    return { authorityBase64, rentalBase64 };
  }

  async saveSignedDoc(
    reservationId: string,
    docType: string,
    base64: string,
  ): Promise<{ key: string }> {
    const buffer = Buffer.from(base64, 'base64');
    const key = `hire-documents/${reservationId}/${docType}-signed-${Date.now()}.pdf`;
    await this.storage.upload(key, buffer, 'application/pdf');
    return { key };
  }
}

HEREDOC_DOCUMENTS_SERVICE_TS

echo "  -> documents/documents.dto.ts"
mkdir -p "$REPO/documents"
cat > "$REPO/documents/documents.dto.ts" << 'HEREDOC_DOCUMENTS_DTO_TS'
import { IsString, IsEnum } from 'class-validator';

export enum SigningMethod {
  DRAW = 'DRAW',
  TYPE = 'TYPE',
  UPLOAD = 'UPLOAD',
}

export class SaveSignatureDto {
  @IsString()
  signatureData: string;

  @IsEnum(SigningMethod)
  signingMethod: SigningMethod;
}

export class SaveSignedDocDto {
  @IsString()
  base64: string;
}

HEREDOC_DOCUMENTS_DTO_TS

echo "  -> payments/payments.service.ts"
mkdir -p "$REPO/payments"
cat > "$REPO/payments/payments.service.ts" << 'HEREDOC_PAYMENTS_SERVICE_TS'
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChargeType, Payment, Reservation } from '@prisma/client';
import {
  CreateChargeTypeDto,
  UpdateChargeTypeDto,
  CreatePaymentDto,
  ProcessPaymentDto,
} from './payments.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  getChargeTypes(): Promise<ChargeType[]> {
    return this.prisma.chargeType.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  createChargeType(data: CreateChargeTypeDto): Promise<ChargeType> {
    return this.prisma.chargeType.create({ data });
  }

  updateChargeType(id: string, data: UpdateChargeTypeDto): Promise<ChargeType> {
    return this.prisma.chargeType.update({ where: { id }, data });
  }

  getPayments(reservationId?: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: reservationId ? { reservationId } : undefined,
      include: {
        reservation: {
          include: {
            customer: true,
            vehicle: { include: { branch: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  createPayment(data: CreatePaymentDto): Promise<Payment> {
    return this.prisma.payment.create({
      data: {
        reservation: { connect: { id: data.reservationId } },
        chargeType: data.chargeType,
        description: data.description ?? null,
        amount: data.amount,
        status: 'PENDING',
        cardReference: data.cardReference ?? null,
      },
      include: {
        reservation: { include: { customer: true } },
      },
    });
  }

  processPayment(id: string, data: ProcessPaymentDto): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status: 'PAID',
        method: data.method,
        processedBy: data.processedBy,
        processedAt: new Date(),
      },
    });
  }

  deletePayment(id: string): Promise<Payment> {
    return this.prisma.payment.delete({ where: { id } });
  }

  searchReservations(query: string): Promise<Reservation[]> {
    return this.prisma.reservation.findMany({
      where: {
        OR: [
          { reservationNumber: { contains: query, mode: 'insensitive' } },
          { fileNumber: { contains: query, mode: 'insensitive' } },
          { customer: { firstName: { contains: query, mode: 'insensitive' } } },
          { customer: { lastName: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        customer: true,
        vehicle: { include: { branch: true } },
        payments: true,
      },
      take: 10,
    });
  }
}

HEREDOC_PAYMENTS_SERVICE_TS

echo "  -> payments/payments.dto.ts"
mkdir -p "$REPO/payments"
cat > "$REPO/payments/payments.dto.ts" << 'HEREDOC_PAYMENTS_DTO_TS'
import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export class CreateChargeTypeDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  defaultAmount?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateChargeTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  defaultAmount?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreatePaymentDto {
  @IsString()
  reservationId: string;

  @IsString()
  chargeType: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  cardReference?: string;
}

export class ProcessPaymentDto {
  @IsString()
  method: string;

  @IsString()
  processedBy: string;
}

HEREDOC_PAYMENTS_DTO_TS

echo "  -> reservations/reservations.dto.ts"
mkdir -p "$REPO/reservations"
cat > "$REPO/reservations/reservations.dto.ts" << 'HEREDOC_RESERVATIONS_DTO_TS'
import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ReservationStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum BranchCode {
  KPK = 'KPK',
  COB = 'COB',
}

// ─── Nested DTOs ──────────────────────────────────────────────────────────────

export class CustomerInputDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  suburb?: string;

  @IsString()
  @IsOptional()
  postcode?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  licenceNumber?: string;

  @IsString()
  @IsOptional()
  licenceState?: string;

  @IsString()
  @IsOptional()
  licenceExpiry?: string;

  @IsString()
  @IsOptional()
  dob?: string;
}

// ─── Reservation CRUD ─────────────────────────────────────────────────────────

export class UpdateReservationDto {
  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  vehicleId?: string;

  /** Edit form sends `customer`; new intake form sends `driver` — both accepted */
  @ValidateNested()
  @Type(() => CustomerInputDto)
  @IsOptional()
  customer?: CustomerInputDto;

  @ValidateNested()
  @Type(() => CustomerInputDto)
  @IsOptional()
  driver?: CustomerInputDto;
}

// ─── markOnHire ───────────────────────────────────────────────────────────────

export class MarkOnHireDto {
  // Currently the service does not read any body fields for this action.
  // Keeping the DTO as a placeholder so the controller is consistently typed
  // and future fields (e.g. odometerIn) can be added without a breaking change.
  @IsString()
  @IsOptional()
  notes?: string;
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export class AddReservationNoteDto {
  @IsString()
  note: string;

  @IsString()
  authorName: string;
}

// ─── Payment Cards ────────────────────────────────────────────────────────────

export class AddPaymentCardDto {
  @IsString()
  cardType: string;

  @IsString()
  cardNumber: string;

  @IsString()
  expiryDate: string;

  @IsString()
  cardholderName: string;
}

// ─── Additional Drivers ───────────────────────────────────────────────────────

export class AddAdditionalDriverDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  licenceNumber: string;

  @IsString()
  @IsOptional()
  licenceExpiry?: string;

  @IsString()
  @IsOptional()
  dob?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

// ─── Cancellation / Reports ───────────────────────────────────────────────────

export class GetCancellationReasonsDto {
  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  to?: string;
}

HEREDOC_RESERVATIONS_DTO_TS

echo "  -> main.ts"
mkdir -p "$REPO/"
cat > "$REPO/main.ts" << 'HEREDOC_MAIN_TS'
import 'dotenv/config'; // ESM-safe dotenv — replaces require('dotenv').config()
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express'; // proper named imports instead of require()

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ limit: '20mb', extended: true }));

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://fluffy-sniffle-5gw5q66g4rwwc775r-3000.app.github.dev',
      /\.app\.github\.dev$/,
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,        // auto-transform payloads to DTO class instances
    whitelist: true,        // strip properties not in the DTO
    forbidNonWhitelisted: false, // don't throw on extra props — safe for gradual rollout
  }));

  await app.listen(3001);
}

bootstrap();

HEREDOC_MAIN_TS

echo ""
echo "All done! Files written to your repo."
echo ""
echo "Next: update your controllers, then run:"
echo "  cd ~/rentpro/apps/api && npx tsc --noEmit"