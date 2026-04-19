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
  createInsurer(@Body() body: any) {
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
  createRepairer(@Body() body: any) {
    return this.claimsService.createRepairer(body);
  }

  @Patch('repairers/:id')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER','CLAIMS_MANAGER','SALES_MANAGER','SALES_REP')
  updateRepairer(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.updateRepairer(id, body);
  }

  @Get('repairers/:id/documents')
  @Roles(...OPS_ROLES)
  getRepairerDocuments(@Param('id') id: string) {
    return this.claimsService.getRepairerDocuments(id);
  }

  @Post('repairers/:id/documents')
  @Roles(...OPS_ROLES)
  async addRepairerDocument(@Param('id') id: string, @Body() body: any) {
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
  create(@Body() body: any) {
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
  update(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.update(id, body);
  }

  // ─── CHILD MODEL ENDPOINTS ───────────────────────────────────────────────────

  @Patch(':id/accident-details')
  @Roles(...CLAIMS_ROLES)
  upsertAccidentDetails(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.upsertAccidentDetails(id, body);
  }

  @Patch(':id/at-fault-party')
  @Roles(...CLAIMS_ROLES)
  upsertAtFaultParty(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.upsertAtFaultParty(id, body);
  }

  @Patch(':id/repair-details')
  @Roles(...CLAIMS_ROLES)
  upsertRepairDetails(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.upsertRepairDetails(id, body);
  }

  // ─── NOTES ───────────────────────────────────────────────────────────────────

  @Post(':id/notes')
  @Roles(...CLAIMS_ROLES)
  addNote(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.addNote(id, body);
  }

  // ─── DOCUMENTS ───────────────────────────────────────────────────────────────

  @Post(':id/documents')
  @Roles(...CLAIMS_ROLES)
  addDocument(@Param('id') id: string, @Body() body: any) {
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
  createInvoice(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.createInvoice(id, body);
  }
}
