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

