import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('logistics')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  findAll(@Query('driverId') driverId?: string) {
    return this.logisticsService.findAll(driverId);
  }

  @Get('today')
  @Roles(Role.ADMIN, Role.OPS_MANAGER, Role.DRIVER)
  getToday(@Query('branchId') branchId?: string) {
    return this.logisticsService.getTodaysDeliveries(branchId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.OPS_MANAGER, Role.DRIVER)
  findOne(@Param('id') id: string) {
    return this.logisticsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  create(@Body() body: any) {
    return this.logisticsService.create(body);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  update(@Param('id') id: string, @Body() body: any) {
    return this.logisticsService.update(id, body);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.OPS_MANAGER, Role.DRIVER)
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.logisticsService.updateStatus(id, status);
  }
}
