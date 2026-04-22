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

