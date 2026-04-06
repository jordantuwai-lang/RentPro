import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('fleet')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get()
  @Roles(Role.ADMIN, Role.OPS_MANAGER, Role.BDM)
  findAll(@Query('branchId') branchId?: string) {
    return this.fleetService.findAll(branchId);
  }

  @Get('summary')
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  getSummary(@Query('branchId') branchId?: string) {
    return this.fleetService.getFleetSummary(branchId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  findOne(@Param('id') id: string) {
    return this.fleetService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  create(@Body() body: any) {
    return this.fleetService.create(body);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  update(@Param('id') id: string, @Body() body: any) {
    return this.fleetService.update(id, body);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.fleetService.updateStatus(id, status);
  }
}
