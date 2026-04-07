import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
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

  @Post(':id/on-hire')
  markOnHire(@Param('id') id: string, @Body() body: any) {
    return this.reservationsService.markOnHire(id, body);
  }

  @Get(':id/notes')
  getNotes(@Param('id') id: string) {
    return this.reservationsService.getNotes(id);
  }

  @Post(':id/notes')
  addNote(@Param('id') id: string, @Body() body: any) {
    return this.reservationsService.addNote(id, body);
  }

  @Post(':id/cards')
  addPaymentCard(@Param('id') id: string, @Body() body: any) {
    return this.reservationsService.addPaymentCard(id, body);
  }

  @Delete(':id/cards/:cardId')
  deletePaymentCard(@Param('cardId') cardId: string) {
    return this.reservationsService.deletePaymentCard(cardId);
  }

  @Post(':id/drivers')
  addAdditionalDriver(@Param('id') id: string, @Body() body: any) {
    return this.reservationsService.addAdditionalDriver(id, body);
  }

  @Delete(':id/drivers/:driverId')
  deleteAdditionalDriver(@Param('driverId') driverId: string) {
    return this.reservationsService.deleteAdditionalDriver(driverId);
  }
}
