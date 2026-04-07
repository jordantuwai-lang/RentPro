import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';

@Controller('admin')
@UseGuards(ClerkAuthGuard)
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

  @Delete('users/:clerkId')
  deleteUser(@Param('clerkId') clerkId: string) {
    return this.adminService.deleteUser(clerkId);
  }
}
