import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateChargeTypeDto, UpdateChargeTypeDto, CreatePaymentDto, ProcessPaymentDto } from './payments.dto';

const FINANCE_ROLES = ['ADMIN','LEADERSHIP','FINANCE_MANAGER','OPS_MANAGER','BRANCH_MANAGER'];

const OPS_ROLES = [
  'ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER','CLAIMS_MANAGER',
  'SALES_MANAGER','FLEET_MANAGER','FINANCE_MANAGER','RECOVERY_MANAGER',
  'CLAIMS_TEAM_IN','CLAIMS_TEAM_OUT','CLAIMS_TEAM_LIABILITY','SALES_REP',
  'FLEET_COORDINATOR',
];

@Controller('payments')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('charge-types')
  @Roles(...OPS_ROLES)
  getChargeTypes() {
    return this.paymentsService.getChargeTypes();
  }

  @Post('charge-types')
  @Roles(...FINANCE_ROLES)
  createChargeType(@Body() body: CreateChargeTypeDto) {
    return this.paymentsService.createChargeType(body);
  }

  @Patch('charge-types/:id')
  @Roles(...FINANCE_ROLES)
  updateChargeType(@Param('id') id: string, @Body() body: UpdateChargeTypeDto) {
    return this.paymentsService.updateChargeType(id, body);
  }

  @Get('search')
  @Roles(...FINANCE_ROLES)
  searchPayments(@Query('q') q: string) {
    return this.paymentsService.searchReservations(q);
  }

  @Get()
  @Roles(...FINANCE_ROLES)
  findAll(@Query('reservationId') reservationId?: string) {
    return this.paymentsService.getPayments(reservationId);
  }

  @Post()
  @Roles(...OPS_ROLES)
  create(@Body() body: CreatePaymentDto) {
    return this.paymentsService.createPayment(body);
  }

  @Patch(':id/process')
  @Roles(...FINANCE_ROLES)
  processPayment(@Param('id') id: string, @Body() body: ProcessPaymentDto) {
    return this.paymentsService.processPayment(id, body);
  }

  @Delete(':id')
  @Roles(...FINANCE_ROLES)
  deletePayment(@Param('id') id: string) {
    return this.paymentsService.deletePayment(id);
  }
}

