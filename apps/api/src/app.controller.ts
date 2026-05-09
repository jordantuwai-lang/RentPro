import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { ClerkAuthGuard } from './auth/clerk.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('whoami')
  @UseGuards(ClerkAuthGuard)
  whoami(@Req() req: any) {
    return { clerkId: req.user?.sub };
  }
}
