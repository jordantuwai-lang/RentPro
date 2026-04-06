import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('claims')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  findAll(@Query('branchId') branchId?: string) {
    return this.claimsService.findAll(branchId);
  }

  @Get('insurers')
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  getInsurerDirectory() {
    return this.claimsService.getInsurerDirectory();
  }

  @Post('insurers')
  @Roles(Role.ADMIN)
  createInsurer(@Body() body: any) {
    return this.claimsService.createInsurer(body);
  }

  @Get('repairers')
  @Roles(Role.ADMIN, Role.OPS_MANAGER, Role.BDM)
  getRepairerDirectory() {
    return this.claimsService.getRepairerDirectory();
  }

  @Post('repairers')
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  createRepairer(@Body() body: any) {
    return this.claimsService.createRepairer(body);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  findOne(@Param('id') id: string) {
    return this.claimsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  create(@Body() body: any) {
    return this.claimsService.create(body);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  update(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.update(id, body);
  }

  @Post(':id/documents')
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  addDocument(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.addDocument(id, body);
  }

  @Post(':id/invoices')
  @Roles(Role.ADMIN, Role.OPS_MANAGER)
  createInvoice(@Param('id') id: string, @Body() body: any) {
    return this.claimsService.createInvoice(id, body);
  }
}
