import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('reservations')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.OPS_MANAGER, Role.BDM)
  findAll(@Query('branchId') branchId?: string) {
    return this.reservationsService.findAll(branchId);
  }

  @Get('availability')
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  checkAvailability(
    @Query('branchId') branchId: string,
    @Query('category') category: string,
    @Query('startDate') startDate: string,
  ) {
    return this.reservationsService.checkAvailability(branchId, category, startDate);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.OPS_MANAGER, Role.BDM)
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  create(@Body() body: any) {
    return this.reservationsService.create(body);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  update(@Param('id') id: string, @Body() body: any) {
    return this.reservationsService.update(id, body);
  }

  @Patch(':id/cancel')
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  cancel(@Param('id') id: string) {
    return this.reservationsService.cancel(id);
  }
}
