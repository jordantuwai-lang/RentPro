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

