import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { DriverAuthService } from './driver-auth.service';

@Controller('auth')
export class DriverAuthController {
  constructor(private readonly driverAuthService: DriverAuthService) {}

  @Post('driver-login')
  async login(@Body() body: { email: string; password: string }) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }
    return this.driverAuthService.login(body.email, body.password);
  }
}

