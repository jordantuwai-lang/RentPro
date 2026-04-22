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
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SaveSignatureDto } from './documents.dto';

const ALL_STAFF = [
  'ADMIN','LEADERSHIP','OPS_MANAGER','BRANCH_MANAGER','CLAIMS_MANAGER',
  'SALES_MANAGER','FLEET_MANAGER','FINANCE_MANAGER','RECOVERY_MANAGER',
  'CLAIMS_TEAM_IN','CLAIMS_TEAM_OUT','CLAIMS_TEAM_LIABILITY','SALES_REP',
  'FLEET_COORDINATOR','CSE_DRIVER','RECOVERY_AGENT',
];

@Controller('documents')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('templates')
  @Roles(...ALL_STAFF)
  getTemplates() {
    return this.documentsService.getTemplates();
  }

  @Get('templates/:type')
  @Roles(...ALL_STAFF)
  getTemplate(@Param('type') type: string) {
    return this.documentsService.getTemplate(type);
  }

  @Get('templates/:type/url')
  @Roles(...ALL_STAFF)
  getTemplateUrl(@Param('type') type: string) {
    return this.documentsService.getTemplateUrl(type);
  }

  @Post('templates/:type')
  @Roles('ADMIN','LEADERSHIP','OPS_MANAGER')
  async upsertTemplate(
    @Param('type') type: string,
    @Body() body: { fileData: string; name: string; mimeType: string },
  ) {
    if (!body.fileData || !body.name || !body.mimeType) {
      throw new BadRequestException('name, fileData, and mimeType are required');
    }
    const buffer = Buffer.from(body.fileData, 'base64');
    return this.documentsService.upsertTemplate(type, body.name, buffer, body.mimeType);
  }

  @Post('signatures/:reservationId')
  @Roles(...ALL_STAFF)
  saveSignature(
    @Param('reservationId') reservationId: string,
    @Body() body: SaveSignatureDto,
  ) {
    return this.documentsService.saveSignature(reservationId, body);
  }

  @Get('signatures/:reservationId')
  @Roles(...ALL_STAFF)
  getSignature(@Param('reservationId') reservationId: string) {
    return this.documentsService.getSignature(reservationId);
  }

  @Post('generate/:reservationId')
  @Roles(...ALL_STAFF)
  generateHireDocs(@Param('reservationId') reservationId: string) {
    return this.documentsService.generateHireDocs(reservationId);
  }

  @Post('save-signed/:reservationId')
  @Roles(...ALL_STAFF)
  saveSignedDoc(
    @Param('reservationId') reservationId: string,
    @Body() body: { docType: string; base64: string },
  ) {
    return this.documentsService.saveSignedDoc(reservationId, body.docType, body.base64);
  }
}

