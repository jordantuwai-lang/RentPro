import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DriverAuthController } from './driver-auth.controller';
import { DriverAuthService } from './driver-auth.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.DRIVER_JWT_SECRET || 'driver-secret-change-in-prod',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [DriverAuthController],
  providers: [DriverAuthService],
  exports: [DriverAuthService, JwtModule],
})
export class DriverAuthModule {}

