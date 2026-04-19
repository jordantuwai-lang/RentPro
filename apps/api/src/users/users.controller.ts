import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

const ALL_STAFF = [
  'ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER','CLAIMS_MANAGER',
  'SALES_MANAGER','FLEET_MANAGER','FINANCE_MANAGER','RECOVERY_MANAGER',
  'CLAIMS_TEAM_IN','CLAIMS_TEAM_OUT','CLAIMS_TEAM_LIABILITY','SALES_REP',
  'FLEET_COORDINATOR','CSE_DRIVER','RECOVERY_AGENT',
];

@Controller('users')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(...ALL_STAFF)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(...ALL_STAFF)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  @Patch(':id')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER')
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }
}
