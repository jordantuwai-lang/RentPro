import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';

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
  create(@Body() body: any) {
    return this.fleetService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.fleetService.update(id, body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.fleetService.updateStatus(id, status);
  }

  @Get(':id/photos')
  getPhotos(@Param('id') id: string) {
    return this.fleetService.getPhotos(id);
  }

  @Post(':id/photos')
  addPhoto(@Param('id') id: string, @Body() body: any) {
    return this.fleetService.addPhoto(id, body);
  }

  @Delete(':id/photos/:photoId')
  deletePhoto(@Param('photoId') photoId: string) {
    return this.fleetService.deletePhoto(photoId);
  }
}
