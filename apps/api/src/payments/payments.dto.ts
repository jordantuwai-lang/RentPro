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

