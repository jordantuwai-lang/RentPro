import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';

@Controller('payments')
@UseGuards(ClerkAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('charge-types')
  getChargeTypes() {
    return this.paymentsService.getChargeTypes();
  }

  @Post('charge-types')
  createChargeType(@Body() body: any) {
    return this.paymentsService.createChargeType(body);
  }

  @Patch('charge-types/:id')
  updateChargeType(@Param('id') id: string, @Body() body: any) {
    return this.paymentsService.updateChargeType(id, body);
  }

  @Get('search')
  searchReservations(@Query('q') q: string) {
    return this.paymentsService.searchReservations(q);
  }

  @Get()
  getPayments(@Query('reservationId') reservationId?: string) {
    return this.paymentsService.getPayments(reservationId);
  }

  @Post()
  createPayment(@Body() body: any) {
    return this.paymentsService.createPayment(body);
  }

  @Patch(':id/process')
  processPayment(@Param('id') id: string, @Body() body: any) {
    return this.paymentsService.processPayment(id, body);
  }

  @Delete(':id')
  deletePayment(@Param('id') id: string) {
    return this.paymentsService.deletePayment(id);
  }
}
