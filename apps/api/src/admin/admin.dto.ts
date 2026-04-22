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

