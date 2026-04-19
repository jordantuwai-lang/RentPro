import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

const OPS_ROLES = [
  'ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER','CLAIMS_MANAGER',
  'SALES_MANAGER','FLEET_MANAGER','FINANCE_MANAGER','RECOVERY_MANAGER',
  'CLAIMS_TEAM_IN','CLAIMS_TEAM_OUT','CLAIMS_TEAM_LIABILITY','SALES_REP',
  'FLEET_COORDINATOR',
];

const ALL_STAFF = [...OPS_ROLES, 'CSE_DRIVER', 'RECOVERY_AGENT'];

@Controller('reservations')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @Roles(...OPS_ROLES)
  findAll(@Query('branchId') branchId?: string) {
    return this.reservationsService.findAll(branchId);
  }

  @Get('availability')
  @Roles(...OPS_ROLES)
  checkAvailability(
    @Query('branchId') branchId: string,
    @Query('category') category: string,
    @Query('startDate') startDate: string,
  ) {
    return this.reservationsService.checkAvailability(branchId, category, startDate);
  }

  @Get('next-number')
  @Roles(...OPS_ROLES)
  getNextNumber() {
    return this.reservationsService.getNextNumber();
  }

  @Get('cancellations')
  @Roles(...OPS_ROLES)
  getCancellationReasons(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reservationsService.getCancellationReasons(from, to);
  }

  @Get(':id')
  @Roles(...OPS_ROLES)
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER','CLAIMS_TEAM_IN','SALES_REP','FLEET_COORDINATOR')
  create(@Body() body: any) {
    return this.reservationsService.create(body);
  }

  @Patch(':id')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER','CLAIMS_TEAM_IN','SALES_REP','FLEET_COORDINATOR')
  update(@Param('id') id: string, @Body() body: any) {
    return this.reservationsService.update(id, body);
  }

  @Patch(':id/cancel')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER')
  cancel(@Param('id') id: string) {
    return this.reservationsService.cancel(id);
  }

  @Post(':id/on-hire')
  @Roles(...ALL_STAFF)
  markOnHire(@Param('id') id: string, @Body() body: any) {
    return this.reservationsService.markOnHire(id, body);
  }

  @Get(':id/notes')
  @Roles(...OPS_ROLES)
  getNotes(@Param('id') id: string) {
    return this.reservationsService.getNotes(id);
  }

  @Post(':id/notes')
  @Roles(...OPS_ROLES)
  addNote(@Param('id') id: string, @Body() body: any) {
    return this.reservationsService.addNote(id, body);
  }

  @Post(':id/cards')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER','CLAIMS_TEAM_IN','FLEET_COORDINATOR')
  addPaymentCard(@Param('id') id: string, @Body() body: any) {
    return this.reservationsService.addPaymentCard(id, body);
  }

  @Delete(':id/cards/:cardId')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER')
  deletePaymentCard(@Param('cardId') cardId: string) {
    return this.reservationsService.deletePaymentCard(cardId);
  }

  @Post(':id/drivers')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER','CLAIMS_TEAM_IN','FLEET_COORDINATOR')
  addAdditionalDriver(@Param('id') id: string, @Body() body: any) {
    return this.reservationsService.addAdditionalDriver(id, body);
  }

  @Delete(':id/drivers/:driverId')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER')
  deleteAdditionalDriver(@Param('driverId') driverId: string) {
    return this.reservationsService.deleteAdditionalDriver(driverId);
  }

  @Post(':id/licence-photo')
  @Roles(...ALL_STAFF)
  uploadLicencePhoto(@Param('id') id: string, @Body('url') url: string) {
    return this.reservationsService.uploadLicencePhoto(id, url);
  }

  @Get(':id/licence-photo')
  @Roles(...ALL_STAFF)
  getLicencePhoto(@Param('id') id: string) {
    return this.reservationsService.getLicencePhoto(id);
  }
}
