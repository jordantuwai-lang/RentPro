import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';

@Controller('claims')
@UseGuards(ClerkAuthGuard)
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.claimsService.findAll(branchId);
  }

  @Get('insurers')
  getInsurerDirectory() {
    return this.claimsService.getInsurerDirectory();
  }

  @Post('insurers')
  createInsurer(@Body() body: any) {
    return this.claimsService.createInsurer(body);
  }

  @Get('repairers')
  getRepairerDirectory() {
    return this.claimsService.getRepairerDirectory();
  }

  @Post('repairers')
  createRepairer(@Body() body: any) {
    return this.claimsService.createRepairer(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.claimsService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.claimsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.update(id, body);
  }

  @Post(':id/documents')
  addDocument(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.addDocument(id, body);
  }

  @Post(':id/invoices')
  createInvoice(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.createInvoice(id, body);
  }
}
