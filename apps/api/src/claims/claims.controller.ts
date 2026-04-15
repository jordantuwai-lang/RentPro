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
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';

@Controller('claims')
@UseGuards(ClerkAuthGuard)
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  // ─── INSURERS ────────────────────────────────────────────────────────────────
  // Must come before :id routes so NestJS doesn't treat "insurers" as an id param

  @Get('insurers')
  getInsurerDirectory() {
    return this.claimsService.getInsurerDirectory();
  }

  @Post('insurers')
  createInsurer(@Body() body: any) {
    return this.claimsService.createInsurer(body);
  }

  // ─── REPAIRERS ───────────────────────────────────────────────────────────────

  @Get('repairers')
  getRepairerDirectory() {
    return this.claimsService.getRepairerDirectory();
  }

  @Post('repairers')
  createRepairer(@Body() body: any) {
    return this.claimsService.createRepairer(body);
  }

  @Patch('repairers/:id')
  updateRepairer(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.updateRepairer(id, body);
  }

  @Get('repairers/:id/documents')
  getRepairerDocuments(@Param('id') id: string) {
    return this.claimsService.getRepairerDocuments(id);
  }

  @Post('repairers/:id/documents')
  addRepairerDocument(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.addRepairerDocument(id, body);
  }

  @Delete('repairers/documents/:docId')
  deleteRepairerDocument(@Param('docId') docId: string) {
    return this.claimsService.deleteRepairerDocument(docId);
  }

  // ─── CLAIMS LIST & CREATE ────────────────────────────────────────────────────

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.claimsService.findAll(branchId);
  }

  @Post()
  create(@Body() body: any) {
    return this.claimsService.create(body);
  }

  // ─── SINGLE CLAIM ────────────────────────────────────────────────────────────

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.claimsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.update(id, body);
  }

  // ─── CHILD MODEL ENDPOINTS ───────────────────────────────────────────────────
  // All use PUT (upsert) — the frontend sends the full object and the backend
  // creates or updates as needed. No need to check if the record exists first.

  @Patch(':id/accident-details')
  upsertAccidentDetails(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.upsertAccidentDetails(id, body);
  }

  @Patch(':id/at-fault-party')
  upsertAtFaultParty(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.upsertAtFaultParty(id, body);
  }

  @Patch(':id/repair-details')
  upsertRepairDetails(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.upsertRepairDetails(id, body);
  }

  // ─── NOTES ───────────────────────────────────────────────────────────────────

  @Post(':id/notes')
  addNote(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.addNote(id, body);
  }

  // ─── DOCUMENTS ───────────────────────────────────────────────────────────────

  @Post(':id/documents')
  addDocument(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.addDocument(id, body);
  }

  @Delete(':id/documents/:docId')
  deleteDocument(@Param('docId') docId: string) {
    return this.claimsService.deleteDocument(docId);
  }

  // ─── INVOICES ────────────────────────────────────────────────────────────────

  @Post(':id/invoices')
  createInvoice(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.createInvoice(id, body);
  }
}