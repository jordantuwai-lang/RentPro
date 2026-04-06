import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';

@Controller('reservations')
@UseGuards(ClerkAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.reservationsService.findAll(branchId);
  }

  @Get('availability')
  checkAvailability(
    @Query('branchId') branchId: string,
    @Query('category') category: string,
    @Query('startDate') startDate: string,
  ) {
    return this.reservationsService.checkAvailability(branchId, category, startDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.reservationsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.reservationsService.update(id, body);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.reservationsService.cancel(id);
  }
}
