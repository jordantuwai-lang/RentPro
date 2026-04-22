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
  @IsString() address: string;
  @IsString() suburb: string;
  @IsEmail() @IsOptional() email?: string;
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

