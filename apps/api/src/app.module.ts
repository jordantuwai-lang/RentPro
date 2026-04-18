import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BranchesModule } from './branches/branches.module';
import { ReservationsModule } from './reservations/reservations.module';
import { FleetModule } from './fleet/fleet.module';
import { ClaimsModule } from './claims/claims.module';
import { LogisticsModule } from './logistics/logistics.module';
import { AdminModule } from './admin/admin.module';
import { DocumentsModule } from './documents/documents.module';
import { PaymentsModule } from './payments/payments.module';
import { LicenceScanController } from './licence-scan/licence-scan.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    BranchesModule,
    ReservationsModule,
    FleetModule,
    ClaimsModule,
    LogisticsModule,
    AdminModule,
    DocumentsModule,
    PaymentsModule,
  ],
  controllers: [LicenceScanController],
})
export class AppModule {}
