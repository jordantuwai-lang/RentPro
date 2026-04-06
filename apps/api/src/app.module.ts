import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BranchesModule } from './branches/branches.module';
import { ReservationsModule } from './reservations/reservations.module';
import { FleetModule } from './fleet/fleet.module';
import { ClaimsModule } from './claims/claims.module';
import { LogisticsModule } from './logistics/logistics.module';

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
  ],
})
export class AppModule {}
