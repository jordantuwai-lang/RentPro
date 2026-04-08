import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';

@Controller('branches')
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
  @UseGuards(ClerkAuthGuard)
  create(@Body() body: any) {
    return this.branchesService.create(body);
  }

  @Patch(':id')
  @UseGuards(ClerkAuthGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.branchesService.update(id, body);
  }
}
