import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async getTemplates() {
    return this.prisma.documentTemplate.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async getTemplate(type: string) {
    return this.prisma.documentTemplate.findUnique({ where: { type } });
  }

  async upsertTemplate(type: string, data: any) {
    return this.prisma.documentTemplate.upsert({
      where: { type },
      update: {
        name: data.name,
        url: data.url,
        key: data.key,
        updatedAt: new Date(),
      },
      create: {
        type,
        name: data.name,
        url: data.url,
        key: data.key,
      },
    });
  }

  async saveSignature(reservationId: string, data: any) {
    return this.prisma.signatureRecord.upsert({
      where: { reservationId },
      update: {
        signatureData: data.signatureData,
        signingMethod: data.signingMethod,
        signedAt: new Date(),
      },
      create: {
        reservation: { connect: { id: reservationId } },
        signatureData: data.signatureData,
        signingMethod: data.signingMethod,
      },
    });
  }

  async getSignature(reservationId: string) {
    return this.prisma.signatureRecord.findUnique({ where: { reservationId } });
  }
}
