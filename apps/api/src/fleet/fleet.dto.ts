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
  state?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum($Enums.VehicleStatus)
  @IsOptional()
  status?: $Enums.VehicleStatus;

  @IsString()
  @IsOptional()
  branchId?: string;

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
  state?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum($Enums.VehicleStatus)
  @IsOptional()
  status?: $Enums.VehicleStatus;

  @IsString()
  @IsOptional()
  branchId?: string;

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

