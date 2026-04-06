import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';

@Controller('logistics')
@UseGuards(ClerkAuthGuard)
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get()
  findAll(@Query('driverId') driverId?: string) {
    return this.logisticsService.findAll(driverId);
  }

  @Get('today')
  getToday(@Query('branchId') branchId?: string) {
    return this.logisticsService.getTodaysDeliveries(branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.logisticsService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.logisticsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.logisticsService.update(id, body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.logisticsService.updateStatus(id, status);
  }
}
