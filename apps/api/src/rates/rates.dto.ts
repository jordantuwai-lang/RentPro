import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateVehicleClassDto {
  @IsString()
  code: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  example?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateVehicleClassDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  example?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class SetRateDto {
  @IsString()
  vehicleClassId: string;

  @IsString()
  branchId: string;

  @IsNumber()
  @IsOptional()
  daily?: number;

  @IsNumber()
  @IsOptional()
  weekly?: number;

  @IsNumber()
  @IsOptional()
  monthly?: number;

  @IsString()
  @IsOptional()
  effectiveFrom?: string;

  @IsString()
  @IsOptional()
  createdBy?: string;
}
