import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';

@Controller('logistics')
@UseGuards(ClerkAuthGuard)
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.logisticsService.findAll(branchId);
  }

  @Get('today')
  getToday(@Query('branchId') branchId?: string) {
    return this.logisticsService.findToday(branchId);
  }

  @Post('bulk-assign')
  bulkAssign(@Body() body: { jobIds: string[]; driverId: string }) {
    return this.logisticsService.bulkAssignDriver(body.jobIds, body.driverId);
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

  @Post(':id/photos')
  addPhoto(@Param('id') id: string, @Body() body: any) {
    return this.logisticsService.addDeliveryPhoto(id, body);
  }

  @Get(':id/photos')
  getPhotos(@Param('id') id: string) {
    return this.logisticsService.getDeliveryPhotos(id);
  }
}
