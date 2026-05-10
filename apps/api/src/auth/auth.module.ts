import { Module } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk.guard';
import { RolesGuard } from './roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [ClerkAuthGuard, RolesGuard, PrismaService],
  exports: [ClerkAuthGuard, RolesGuard],
})
export class AuthModule {}
