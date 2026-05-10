import { Controller, Get, Post, Body, Param, Patch, UseGuards, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OPS_ROLES } from '../auth/roles.constants';
import { CreateUserDto, UpdateUserDto } from './users.dto';

@Controller('users')
@UseGuards(ClerkAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(id, body);
  }

  // ─── GPS location ─────────────────────────────────────────────────────────────

  // Called by the driver's mobile app every ~15 seconds
  @Patch(':id/location')
  updateLocation(
    @Param('id') id: string,
    @Body('lat') lat: number,
    @Body('lng') lng: number,
  ) {
    if (lat == null || lng == null) {
      throw new BadRequestException('lat and lng are required');
    }
    return this.usersService.updateLocation(id, lat, lng);
  }

  // Polled by the ops map page every 15 seconds — returns only active drivers
  @Get('drivers/locations')
  @UseGuards(RolesGuard)
  @Roles(...OPS_ROLES)
  getDriverLocations() {
    return this.usersService.getDriverLocations();
  }
}

