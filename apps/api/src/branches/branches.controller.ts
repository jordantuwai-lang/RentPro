import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('branches')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() body: any) {
    return this.branchesService.create(body);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() body: any) {
    return this.branchesService.update(id, body);
  }
}
