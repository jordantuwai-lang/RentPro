import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RatesService } from './rates.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';

@Controller('rates')
@UseGuards(ClerkAuthGuard)
export class RatesController {
  constructor(private readonly ratesService: RatesService) {}

  @Get('classes')
  findAllClasses() {
    return this.ratesService.findAllClasses();
  }

  @Post('classes')
  createClass(@Body() body: any) {
    return this.ratesService.createClass(body);
  }

  @Patch('classes/:id')
  updateClass(@Param('id') id: string, @Body() body: any) {
    return this.ratesService.updateClass(id, body);
  }

  @Get('history')
  getRateHistory(
    @Query('branchId') branchId: string,
    @Query('vehicleClassId') vehicleClassId: string,
  ) {
    return this.ratesService.getRateHistory(branchId, vehicleClassId);
  }

  @Get()
  getCurrentRates(@Query('branchId') branchId: string) {
    return this.ratesService.getCurrentRates(branchId);
  }

  @Post()
  setRate(@Body() body: any) {
    return this.ratesService.setRate(body);
  }
}
