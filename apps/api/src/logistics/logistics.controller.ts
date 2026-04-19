import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

const ALL_STAFF = [
  'ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER','CLAIMS_MANAGER',
  'SALES_MANAGER','FLEET_MANAGER','FINANCE_MANAGER','RECOVERY_MANAGER',
  'CLAIMS_TEAM_IN','CLAIMS_TEAM_OUT','CLAIMS_TEAM_LIABILITY','SALES_REP',
  'FLEET_COORDINATOR','CSE_DRIVER','RECOVERY_AGENT',
];

const OPS_ROLES = [
  'ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER','CLAIMS_MANAGER',
  'SALES_MANAGER','FLEET_MANAGER','FINANCE_MANAGER','RECOVERY_MANAGER',
  'CLAIMS_TEAM_IN','CLAIMS_TEAM_OUT','CLAIMS_TEAM_LIABILITY','SALES_REP',
  'FLEET_COORDINATOR',
];

@Controller('logistics')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get()
  @Roles(...ALL_STAFF)
  findAll(@Query('branchId') branchId?: string) {
    return this.logisticsService.findAll(branchId);
  }

  @Get('today')
  @Roles(...ALL_STAFF)
  getToday(@Query('branchId') branchId?: string) {
    return this.logisticsService.findToday(branchId);
  }

  @Post('bulk-assign')
  @Roles(...OPS_ROLES)
  bulkAssign(@Body() body: { jobIds: string[]; driverId: string }) {
    return this.logisticsService.bulkAssignDriver(body.jobIds, body.driverId);
  }

  @Get(':id')
  @Roles(...ALL_STAFF)
  findOne(@Param('id') id: string) {
    return this.logisticsService.findOne(id);
  }

  @Post()
  @Roles(...OPS_ROLES)
  create(@Body() body: any) {
    return this.logisticsService.create(body);
  }

  @Patch(':id')
  @Roles(...OPS_ROLES)
  update(@Param('id') id: string, @Body() body: any) {
    return this.logisticsService.update(id, body);
  }

  @Patch(':id/status')
  @Roles(...ALL_STAFF)
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.logisticsService.updateStatus(id, status);
  }

  @Post(':id/photos')
  @Roles(...ALL_STAFF)
  addPhoto(@Param('id') id: string, @Body() body: any) {
    return this.logisticsService.addDeliveryPhoto(id, body);
  }

  @Get(':id/photos')
  @Roles(...ALL_STAFF)
  getPhotos(@Param('id') id: string) {
    return this.logisticsService.getDeliveryPhotos(id);
  }
}
