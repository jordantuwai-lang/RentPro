import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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
  createUser(@Body() body: any) {
    return this.adminService.createUser(body);
  }

  @Patch('users/:clerkId')
  updateUser(@Param('clerkId') clerkId: string, @Body() body: any) {
    return this.adminService.updateUser(clerkId, body);
  }

  @Delete('users/:clerkId')
  deleteUser(@Param('clerkId') clerkId: string) {
    return this.adminService.deleteUser(clerkId);
  }
}
