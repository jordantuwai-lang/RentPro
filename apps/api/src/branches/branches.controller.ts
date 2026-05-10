import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ALL_STAFF } from '../auth/roles.constants';
import { CreateBranchDto, UpdateBranchDto } from './branches.dto';

@Controller('branches')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @Roles(...ALL_STAFF)
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  @Roles(...ALL_STAFF)
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() body: CreateBranchDto) {
    return this.branchesService.create(body);
  }

  @Patch(':id')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER')
  update(@Param('id') id: string, @Body() body: UpdateBranchDto) {
    return this.branchesService.update(id, body);
  }
}
