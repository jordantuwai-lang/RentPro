import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
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

  // New endpoint: get a short-lived download URL for a template
  @Get('templates/:type/url')
  getTemplateUrl(@Param('type') type: string) {
    return this.documentsService.getTemplateUrl(type);
  }

  @Post('templates/:type')
  async upsertTemplate(@Param('type') type: string, @Body() body: any) {
    // Frontend sends: { name, fileData (base64), mimeType }
    if (!body.fileData || !body.name || !body.mimeType) {
      throw new BadRequestException('name, fileData, and mimeType are required');
    }
    // Convert base64 to buffer for R2 upload
    const buffer = Buffer.from(body.fileData, 'base64');
    return this.documentsService.upsertTemplate(
      type,
      body.name,
      buffer,
      body.mimeType,
    );
  }

  @Post('signatures/:reservationId')
  saveSignature(
    @Param('reservationId') reservationId: string,
    @Body() body: any,
  ) {
    return this.documentsService.saveSignature(reservationId, body);
  }

  @Get('signatures/:reservationId')
  getSignature(@Param('reservationId') reservationId: string) {
    return this.documentsService.getSignature(reservationId);
  }
}
