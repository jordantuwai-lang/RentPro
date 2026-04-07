import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';

@Controller('documents')
@UseGuards(ClerkAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('templates')
  getTemplates() {
    return this.documentsService.getTemplates();
  }

  @Get('templates/:type')
  getTemplate(@Param('type') type: string) {
    return this.documentsService.getTemplate(type);
  }

  @Post('templates/:type')
  upsertTemplate(@Param('type') type: string, @Body() body: any) {
    return this.documentsService.upsertTemplate(type, body);
  }

  @Post('signatures/:reservationId')
  saveSignature(@Param('reservationId') reservationId: string, @Body() body: any) {
    return this.documentsService.saveSignature(reservationId, body);
  }

  @Get('signatures/:reservationId')
  getSignature(@Param('reservationId') reservationId: string) {
    return this.documentsService.getSignature(reservationId);
  }
}
