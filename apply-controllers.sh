#!/bin/bash
set -e
REPO="$HOME/rentpro/apps/api/src"
echo "Writing refactored controllers into $REPO ..."

echo "  -> fleet/fleet.controller.ts"
cat > "$REPO/fleet/fleet.controller.ts" << 'HEREDOC_FLEET_CONTROLLER_TS'
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { CreateVehicleDto, UpdateVehicleDto, UpdateVehicleStatusDto, AddPhotoDto } from './fleet.dto';

@Controller('fleet')
@UseGuards(ClerkAuthGuard)
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.fleetService.findAll(branchId);
  }

  @Get('summary')
  getSummary(@Query('branchId') branchId?: string) {
    return this.fleetService.getFleetSummary(branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fleetService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateVehicleDto) {
    return this.fleetService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateVehicleDto) {
    return this.fleetService.update(id, body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateVehicleStatusDto) {
    return this.fleetService.updateStatus(id, body);
  }

  @Get(':id/photos')
  getPhotos(@Param('id') id: string) {
    return this.fleetService.getPhotos(id);
  }

  @Post(':id/photos')
  addPhoto(@Param('id') id: string, @Body() body: AddPhotoDto) {
    return this.fleetService.addPhoto(id, body);
  }

  @Delete(':id/photos/:photoId')
  deletePhoto(@Param('photoId') photoId: string) {
    return this.fleetService.deletePhoto(photoId);
  }
}

HEREDOC_FLEET_CONTROLLER_TS

echo "  -> logistics/logistics.controller.ts"
cat > "$REPO/logistics/logistics.controller.ts" << 'HEREDOC_LOGISTICS_CONTROLLER_TS'
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
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
  getToday(@Query('branchId') branchId?: string) {
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

HEREDOC_LOGISTICS_CONTROLLER_TS

echo "  -> claims/claims.controller.ts"
cat > "$REPO/claims/claims.controller.ts" << 'HEREDOC_CLAIMS_CONTROLLER_TS'
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CreateClaimDto,
  UpdateClaimDto,
  UpsertAccidentDetailsDto,
  UpsertAtFaultPartyDto,
  UpsertRepairDetailsDto,
  AddNoteDto,
  AddClaimDocumentDto,
  CreateInvoiceDto,
  CreateInsurerDto,
  CreateRepairerDto,
  UpdateRepairerDto,
} from './claims.dto';

const OPS_ROLES = [
  'ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER','CLAIMS_MANAGER',
  'SALES_MANAGER','FLEET_MANAGER','FINANCE_MANAGER','RECOVERY_MANAGER',
  'CLAIMS_TEAM_IN','CLAIMS_TEAM_OUT','CLAIMS_TEAM_LIABILITY','SALES_REP',
  'FLEET_COORDINATOR',
];

const CLAIMS_ROLES = [
  'ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER','CLAIMS_MANAGER',
  'CLAIMS_TEAM_IN','CLAIMS_TEAM_OUT','CLAIMS_TEAM_LIABILITY','RECOVERY_MANAGER',
];

@Controller('claims')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  // ─── INSURERS ────────────────────────────────────────────────────────────────

  @Get('insurers')
  @Roles(...OPS_ROLES)
  getInsurerDirectory() {
    return this.claimsService.getInsurerDirectory();
  }

  @Post('insurers')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','CLAIMS_MANAGER')
  createInsurer(@Body() body: CreateInsurerDto) {
    return this.claimsService.createInsurer(body);
  }

  // ─── REPAIRERS ───────────────────────────────────────────────────────────────

  @Get('repairers')
  @Roles(...OPS_ROLES)
  getRepairerDirectory() {
    return this.claimsService.getRepairerDirectory();
  }

  @Post('repairers')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','CLAIMS_MANAGER','SALES_MANAGER','SALES_REP')
  createRepairer(@Body() body: CreateRepairerDto) {
    return this.claimsService.createRepairer(body);
  }

  @Patch('repairers/:id')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','CLAIMS_MANAGER','SALES_MANAGER','SALES_REP')
  updateRepairer(@Param('id') id: string, @Body() body: UpdateRepairerDto) {
    return this.claimsService.updateRepairer(id, body);
  }

  @Get('repairers/:id/documents')
  @Roles(...OPS_ROLES)
  getRepairerDocuments(@Param('id') id: string) {
    return this.claimsService.getRepairerDocuments(id);
  }

  @Post('repairers/:id/documents')
  @Roles(...OPS_ROLES)
  async addRepairerDocument(@Param('id') id: string, @Body() body: { fileData: string; name: string; mimeType: string }) {
    if (!body.fileData || !body.name || !body.mimeType) {
      throw new BadRequestException('name, fileData, and mimeType are required');
    }
    const buffer = Buffer.from(body.fileData, 'base64');
    return this.claimsService.addRepairerDocument(id, body.name, buffer, body.mimeType);
  }

  @Get('repairers/documents/:docId/url')
  @Roles(...OPS_ROLES)
  getRepairerDocumentUrl(@Param('docId') docId: string) {
    return this.claimsService.getRepairerDocumentUrl(docId);
  }

  @Delete('repairers/documents/:docId')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','CLAIMS_MANAGER','SALES_MANAGER')
  deleteRepairerDocument(@Param('docId') docId: string) {
    return this.claimsService.deleteRepairerDocument(docId);
  }

  // ─── CLAIMS LIST & CREATE ────────────────────────────────────────────────────

  @Get()
  @Roles(...OPS_ROLES)
  findAll(@Query('branchId') branchId?: string) {
    return this.claimsService.findAll(branchId);
  }

  @Post()
  @Roles(...CLAIMS_ROLES)
  create(@Body() body: CreateClaimDto) {
    return this.claimsService.create(body);
  }

  // ─── SINGLE CLAIM ────────────────────────────────────────────────────────────

  @Get(':id')
  @Roles(...OPS_ROLES)
  findOne(@Param('id') id: string) {
    return this.claimsService.findOne(id);
  }

  @Patch(':id')
  @Roles(...CLAIMS_ROLES)
  update(@Param('id') id: string, @Body() body: UpdateClaimDto) {
    return this.claimsService.update(id, body);
  }

  // ─── CHILD MODEL ENDPOINTS ───────────────────────────────────────────────────

  @Patch(':id/accident-details')
  @Roles(...CLAIMS_ROLES)
  upsertAccidentDetails(@Param('id') id: string, @Body() body: UpsertAccidentDetailsDto) {
    return this.claimsService.upsertAccidentDetails(id, body);
  }

  @Patch(':id/at-fault-party')
  @Roles(...CLAIMS_ROLES)
  upsertAtFaultParty(@Param('id') id: string, @Body() body: UpsertAtFaultPartyDto) {
    return this.claimsService.upsertAtFaultParty(id, body);
  }

  @Patch(':id/repair-details')
  @Roles(...CLAIMS_ROLES)
  upsertRepairDetails(@Param('id') id: string, @Body() body: UpsertRepairDetailsDto) {
    return this.claimsService.upsertRepairDetails(id, body);
  }

  // ─── NOTES ───────────────────────────────────────────────────────────────────

  @Post(':id/notes')
  @Roles(...CLAIMS_ROLES)
  addNote(@Param('id') id: string, @Body() body: AddNoteDto) {
    return this.claimsService.addNote(id, body);
  }

  // ─── DOCUMENTS ───────────────────────────────────────────────────────────────

  @Post(':id/documents')
  @Roles(...CLAIMS_ROLES)
  addDocument(@Param('id') id: string, @Body() body: AddClaimDocumentDto) {
    return this.claimsService.addDocument(id, body);
  }

  @Delete(':id/documents/:docId')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','CLAIMS_MANAGER')
  deleteDocument(@Param('docId') docId: string) {
    return this.claimsService.deleteDocument(docId);
  }

  // ─── INVOICES ────────────────────────────────────────────────────────────────

  @Post(':id/invoices')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','FINANCE_MANAGER','CLAIMS_MANAGER')
  createInvoice(@Param('id') id: string, @Body() body: CreateInvoiceDto) {
    return this.claimsService.createInvoice(id, body);
  }
}

HEREDOC_CLAIMS_CONTROLLER_TS

echo "  -> admin/admin.controller.ts"
cat > "$REPO/admin/admin.controller.ts" << 'HEREDOC_ADMIN_CONTROLLER_TS'
import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto, UpdateUserDto } from './admin.dto';

@Controller('admin')
@UseGuards(ClerkAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Post('users')
  createUser(@Body() body: CreateUserDto) {
    return this.adminService.createUser(body);
  }

  @Patch('users/:clerkId')
  updateUser(@Param('clerkId') clerkId: string, @Body() body: UpdateUserDto) {
    return this.adminService.updateUser(clerkId, body);
  }

  @Delete('users/:clerkId')
  deleteUser(@Param('clerkId') clerkId: string) {
    return this.adminService.deleteUser(clerkId);
  }
}

HEREDOC_ADMIN_CONTROLLER_TS

echo "  -> documents/documents.controller.ts"
cat > "$REPO/documents/documents.controller.ts" << 'HEREDOC_DOCUMENTS_CONTROLLER_TS'
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SaveSignatureDto } from './documents.dto';

const ALL_STAFF = [
  'ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER','CLAIMS_MANAGER',
  'SALES_MANAGER','FLEET_MANAGER','FINANCE_MANAGER','RECOVERY_MANAGER',
  'CLAIMS_TEAM_IN','CLAIMS_TEAM_OUT','CLAIMS_TEAM_LIABILITY','SALES_REP',
  'FLEET_COORDINATOR','CSE_DRIVER','RECOVERY_AGENT',
];

@Controller('documents')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('templates')
  @Roles(...ALL_STAFF)
  getTemplates() {
    return this.documentsService.getTemplates();
  }

  @Get('templates/:type')
  @Roles(...ALL_STAFF)
  getTemplate(@Param('type') type: string) {
    return this.documentsService.getTemplate(type);
  }

  @Get('templates/:type/url')
  @Roles(...ALL_STAFF)
  getTemplateUrl(@Param('type') type: string) {
    return this.documentsService.getTemplateUrl(type);
  }

  @Post('templates/:type')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER')
  async upsertTemplate(
    @Param('type') type: string,
    @Body() body: { fileData: string; name: string; mimeType: string },
  ) {
    if (!body.fileData || !body.name || !body.mimeType) {
      throw new BadRequestException('name, fileData, and mimeType are required');
    }
    const buffer = Buffer.from(body.fileData, 'base64');
    return this.documentsService.upsertTemplate(type, body.name, buffer, body.mimeType);
  }

  @Post('signatures/:reservationId')
  @Roles(...ALL_STAFF)
  saveSignature(
    @Param('reservationId') reservationId: string,
    @Body() body: SaveSignatureDto,
  ) {
    return this.documentsService.saveSignature(reservationId, body);
  }

  @Get('signatures/:reservationId')
  @Roles(...ALL_STAFF)
  getSignature(@Param('reservationId') reservationId: string) {
    return this.documentsService.getSignature(reservationId);
  }

  @Post('generate/:reservationId')
  @Roles(...ALL_STAFF)
  generateHireDocs(@Param('reservationId') reservationId: string) {
    return this.documentsService.generateHireDocs(reservationId);
  }

  @Post('save-signed/:reservationId')
  @Roles(...ALL_STAFF)
  saveSignedDoc(
    @Param('reservationId') reservationId: string,
    @Body() body: { docType: string; base64: string },
  ) {
    return this.documentsService.saveSignedDoc(reservationId, body.docType, body.base64);
  }
}

HEREDOC_DOCUMENTS_CONTROLLER_TS

echo "  -> payments/payments.controller.ts"
cat > "$REPO/payments/payments.controller.ts" << 'HEREDOC_PAYMENTS_CONTROLLER_TS'
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

HEREDOC_PAYMENTS_CONTROLLER_TS

echo "  -> reservations/reservations.controller.ts"
cat > "$REPO/reservations/reservations.controller.ts" << 'HEREDOC_RESERVATIONS_CONTROLLER_TS'
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  UpdateReservationDto,
  MarkOnHireDto,
  AddReservationNoteDto,
  AddPaymentCardDto,
  AddAdditionalDriverDto,
} from './reservations.dto';

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
  update(@Param('id') id: string, @Body() body: UpdateReservationDto) {
    return this.reservationsService.update(id, body);
  }

  @Patch(':id/cancel')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER')
  cancel(@Param('id') id: string) {
    return this.reservationsService.cancel(id);
  }

  @Post(':id/on-hire')
  @Roles(...ALL_STAFF)
  markOnHire(@Param('id') id: string, @Body() body: MarkOnHireDto) {
    return this.reservationsService.markOnHire(id, body);
  }

  @Get(':id/notes')
  @Roles(...OPS_ROLES)
  getNotes(@Param('id') id: string) {
    return this.reservationsService.getNotes(id);
  }

  @Post(':id/notes')
  @Roles(...OPS_ROLES)
  addNote(@Param('id') id: string, @Body() body: AddReservationNoteDto) {
    return this.reservationsService.addNote(id, body);
  }

  @Post(':id/cards')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER','CLAIMS_TEAM_IN','FLEET_COORDINATOR')
  addPaymentCard(@Param('id') id: string, @Body() body: AddPaymentCardDto) {
    return this.reservationsService.addPaymentCard(id, body);
  }

  @Delete(':id/cards/:cardId')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER')
  deletePaymentCard(@Param('cardId') cardId: string) {
    return this.reservationsService.deletePaymentCard(cardId);
  }

  @Post(':id/drivers')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER','CLAIMS_TEAM_IN','FLEET_COORDINATOR')
  addAdditionalDriver(@Param('id') id: string, @Body() body: AddAdditionalDriverDto) {
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

HEREDOC_RESERVATIONS_CONTROLLER_TS

echo ""
echo "All controllers written. Now run:"
echo "  cd ~/rentpro/apps/api && npx tsc --noEmit"