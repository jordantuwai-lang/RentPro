import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async getTemplates() {
    const templates = await this.prisma.documentTemplate.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
    // Strip the raw url field - frontend should request a presigned url separately
    return templates.map(({ url, ...rest }) => rest);
  }

  async getTemplate(type: string) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { type },
    });
    if (!template) return null;
    const { url, ...rest } = template;
    return rest;
  }

  async getTemplateUrl(type: string): Promise<{ url: string } | null> {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { type },
    });
    if (!template || !template.key) return null;
    const url = await this.storage.getPresignedUrl(template.key);
    return { url };
  }

  async upsertTemplate(type: string, name: string, buffer: Buffer, mimeType: string) {
    // Build a clean R2 key: e.g. document-templates/rental-agreement-1714123456789.pdf
    const ext = mimeType === 'application/pdf' ? 'pdf' : 'bin';
    const key = `document-templates/${type}-${Date.now()}.${ext}`;

    // Upload to R2
    await this.storage.upload(key, buffer, mimeType);

    // Check if there's an existing template with a key so we can clean up old file
    const existing = await this.prisma.documentTemplate.findUnique({
      where: { type },
    });
    if (existing?.key && existing.key !== key) {
      try {
        await this.storage.delete(existing.key);
      } catch {
        // Old file deletion failure is non-fatal
      }
    }

    // Save only the key to DB — never the file data
    return this.prisma.documentTemplate.upsert({
      where: { type },
      update: {
        name,
        key,
        url: key, // keep url col populated with key for backwards compat
        updatedAt: new Date(),
      },
      create: {
        type,
        name,
        key,
        url: key,
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
