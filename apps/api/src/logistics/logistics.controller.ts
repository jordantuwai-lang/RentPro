import { Req, Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateDeliveryDto, UpdateDeliveryDto, UpdateDeliveryStatusDto, BulkAssignDriverDto, AddDeliveryPhotoDto } from './logistics.dto';

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
  async getToday(@Req() req: any, @Query('branchId') branchId?: string) {
    const user = req.user;
    if (user && (user.role === 'DRIVER' || user.role === 'CSE_DRIVER')) {
      return this.logisticsService.findTodayForDriver(user.clerkId);
    }
    return this.logisticsService.findToday(branchId);
  }

@Post('bulk-assign')
  @Roles(...OPS_ROLES)
  bulkAssign(@Body() body: BulkAssignDriverDto) {
    return this.logisticsService.bulkAssignDriver(body.jobIds, body.driverId);
  }

  @Get(':id')
  @Roles(...ALL_STAFF)
  findOne(@Param('id') id: string) {
    return this.logisticsService.findOne(id);
  }

  @Post()
  @Roles(...OPS_ROLES)
  create(@Body() body: CreateDeliveryDto) {
    return this.logisticsService.create(body);
  }

  @Patch(':id')
  @Roles(...OPS_ROLES)
  update(@Param('id') id: string, @Body() body: UpdateDeliveryDto) {
    return this.logisticsService.update(id, body);
  }

  @Patch(':id/status')
  @Roles(...ALL_STAFF)
  updateStatus(@Param('id') id: string, @Body() body: UpdateDeliveryStatusDto) {
    return this.logisticsService.updateStatus(id, body);
  }

  @Post(':id/photos')
  @Roles(...ALL_STAFF)
  addPhoto(@Param('id') id: string, @Body() body: AddDeliveryPhotoDto) {
    return this.logisticsService.addDeliveryPhoto(id, body);
  }

  @Get(':id/photos')
  @Roles(...ALL_STAFF)
  getPhotos(@Param('id') id: string) {
    return this.logisticsService.getDeliveryPhotos(id);
  }

  @Delete(':id/photos/:photoId')
  @Roles(...OPS_ROLES)
  deletePhoto(@Param('photoId') photoId: string) {
    return this.logisticsService.deleteDeliveryPhoto(photoId);
  }
}

