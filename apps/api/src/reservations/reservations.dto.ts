import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  ValidateNested,
  IsNumberString,
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

// ─── Intake-form nested DTOs ──────────────────────────────────────────────────

export class AccidentInputDto {
  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class AdditionalInputDto {
  @IsString()
  @IsOptional()
  policeReportNo?: string;

  @IsString()
  @IsOptional()
  policeStation?: string;

  @IsString()
  @IsOptional()
  policeOfficerName?: string;

  @IsString()
  @IsOptional()
  policeOfficerPhone?: string;

  @IsString()
  @IsOptional()
  witnessName?: string;

  @IsString()
  @IsOptional()
  witnessPhone?: string;
}

export class AtFaultInputDto {
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
  vehicleRegistration?: string;

  @IsString()
  @IsOptional()
  vehicleMake?: string;

  @IsString()
  @IsOptional()
  vehicleModel?: string;

  @IsString()
  @IsOptional()
  vehicleYear?: string;

  @IsString()
  @IsOptional()
  insuranceProvider?: string;

  @IsString()
  @IsOptional()
  claimNumber?: string;
}

export class NafInputDto {
  @IsString()
  @IsOptional()
  rego?: string;

  @IsString()
  @IsOptional()
  year?: string;

  @IsString()
  @IsOptional()
  make?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  bodyType?: string;

  @IsString()
  @IsOptional()
  insCarrier?: string;

  @IsString()
  @IsOptional()
  insPolicy?: string;

  @IsString()
  @IsOptional()
  insPhone?: string;

  @IsString()
  @IsOptional()
  insAgent?: string;

  @IsString()
  @IsOptional()
  insAgency?: string;

  @IsString()
  @IsOptional()
  coverType?: string;
}

// ─── Reservation CRUD ─────────────────────────────────────────────────────────

export class CreateReservationDto {
  /** New intake form sends driver; legacy edit form sends customer */
  @ValidateNested()
  @Type(() => CustomerInputDto)
  @IsOptional()
  driver?: CustomerInputDto;

  @ValidateNested()
  @Type(() => CustomerInputDto)
  @IsOptional()
  customer?: CustomerInputDto;

  @IsString()
  @IsOptional()
  vehicleId?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus;

  @IsString()
  @IsOptional()
  sourceOfBusiness?: string;

  @IsString()
  @IsOptional()
  partnerName?: string;

  @IsString()
  @IsOptional()
  hireType?: string;

  @ValidateNested()
  @Type(() => AccidentInputDto)
  @IsOptional()
  accident?: AccidentInputDto;

  @ValidateNested()
  @Type(() => AtFaultInputDto)
  @IsOptional()
  atFault?: AtFaultInputDto;

  @ValidateNested()
  @Type(() => AdditionalInputDto)
  @IsOptional()
  additional?: AdditionalInputDto;

  @IsString()
  @IsOptional()
  pickupBranchId?: string;

  @IsString()
  @IsOptional()
  returnBranchId?: string;

  @IsString()
  @IsOptional()
  ratePlanType?: string;

  @IsString()
  @IsOptional()
  rateCode?: string;

  @IsString()
  @IsOptional()
  rateClass?: string;

  @IsString()
  @IsOptional()
  estimatedKms?: string;

  @IsString()
  @IsOptional()
  unitNumber?: string;

  @IsString()
  @IsOptional()
  unitTag?: string;

  @IsString()
  @IsOptional()
  unitDescription?: string;

  @ValidateNested()
  @Type(() => NafInputDto)
  @IsOptional()
  naf?: NafInputDto;

  @IsString()
  @IsOptional()
  authorityToActName?: string;

  @IsString()
  @IsOptional()
  authorityToActUrl?: string;

  @IsString()
  @IsOptional()
  rentalAgreementName?: string;

  @IsString()
  @IsOptional()
  rentalAgreementUrl?: string;
}

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

  @IsString()
  @IsOptional()
  sourceOfBusiness?: string;

  @IsString()
  @IsOptional()
  hireType?: string;

  /** Edit form sends `customer`; new intake form sends `driver` — both accepted */
  @ValidateNested()
  @Type(() => CustomerInputDto)
  @IsOptional()
  customer?: CustomerInputDto;

  @ValidateNested()
  @Type(() => CustomerInputDto)
  @IsOptional()
  driver?: CustomerInputDto;

  @ValidateNested()
  @Type(() => AccidentInputDto)
  @IsOptional()
  accident?: AccidentInputDto;

  @ValidateNested()
  @Type(() => AtFaultInputDto)
  @IsOptional()
  atFault?: AtFaultInputDto;

  @ValidateNested()
  @Type(() => AdditionalInputDto)
  @IsOptional()
  additional?: AdditionalInputDto;

  @IsString()
  @IsOptional()
  pickupBranchId?: string;

  @IsString()
  @IsOptional()
  returnBranchId?: string;

  @IsString()
  @IsOptional()
  ratePlanType?: string;

  @IsString()
  @IsOptional()
  rateCode?: string;

  @IsString()
  @IsOptional()
  rateClass?: string;

  @IsString()
  @IsOptional()
  estimatedKms?: string;

  @IsString()
  @IsOptional()
  unitNumber?: string;

  @IsString()
  @IsOptional()
  unitTag?: string;

  @IsString()
  @IsOptional()
  unitDescription?: string;

  @ValidateNested()
  @Type(() => NafInputDto)
  @IsOptional()
  naf?: NafInputDto;

  @IsString()
  @IsOptional()
  authorityToActName?: string;

  @IsString()
  @IsOptional()
  authorityToActUrl?: string;

  @IsString()
  @IsOptional()
  rentalAgreementName?: string;

  @IsString()
  @IsOptional()
  rentalAgreementUrl?: string;
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

// ─── Schedule ─────────────────────────────────────────────────────────────────

export class AddToScheduleDto {
  @IsString()
  scheduledAt: string;

  @IsString()
  jobType: string;

  @IsString()
  address: string;

  @IsString()
  suburb: string;

  @IsString()
  @IsOptional()
  driverId?: string;
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

