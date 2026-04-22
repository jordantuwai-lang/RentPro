import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { PDFDocument } from 'pdf-lib';
import { DocumentTemplate, SignatureRecord } from '@prisma/client';
import { SaveSignatureDto } from './documents.dto';

type TemplateWithoutUrl = Omit<DocumentTemplate, 'url'>;

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async getTemplates(): Promise<TemplateWithoutUrl[]> {
    const templates = await this.prisma.documentTemplate.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
    // Strip the raw url field — frontend must request a presigned URL separately
    return templates.map(({ url, ...rest }) => rest);
  }

  async getTemplate(type: string): Promise<TemplateWithoutUrl | null> {
    const template = await this.prisma.documentTemplate.findUnique({ where: { type } });
    if (!template) return null;
    const { url, ...rest } = template;
    return rest;
  }

  async getTemplateUrl(type: string): Promise<{ url: string } | null> {
    const template = await this.prisma.documentTemplate.findUnique({ where: { type } });
    if (!template?.key) return null;
    const url = await this.storage.getPresignedUrl(template.key);
    return { url };
  }

  async upsertTemplate(
    type: string,
    name: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<DocumentTemplate> {
    const ext = mimeType === 'application/pdf' ? 'pdf' : 'bin';
    const key = `document-templates/${type}-${Date.now()}.${ext}`;

    await this.storage.upload(key, buffer, mimeType);

    // Clean up old R2 object if one exists
    const existing = await this.prisma.documentTemplate.findUnique({ where: { type } });
    if (existing?.key && existing.key !== key) {
      try {
        await this.storage.delete(existing.key);
      } catch (err) {
        this.logger.warn(`Failed to delete old template ${existing.key}: ${(err as Error).message}`);
      }
    }

    return this.prisma.documentTemplate.upsert({
      where: { type },
      update: {
        name,
        key,
        url: key, // keep url col populated with key for backwards compat
        updatedAt: new Date(),
      },
      create: { type, name, key, url: key },
    });
  }

  async saveSignature(reservationId: string, data: SaveSignatureDto): Promise<SignatureRecord> {
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

  async getSignature(reservationId: string): Promise<SignatureRecord | null> {
    return this.prisma.signatureRecord.findUnique({ where: { reservationId } });
  }

  async generateHireDocs(reservationId: string): Promise<{ authorityBase64: string; rentalBase64: string }> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { customer: true, vehicle: { include: { branch: true } } },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');

    const [authorityTemplate, rentalTemplate] = await Promise.all([
      this.prisma.documentTemplate.findUnique({ where: { type: 'authority-to-act' } }),
      this.prisma.documentTemplate.findUnique({ where: { type: 'rental-agreement' } }),
    ]);
    if (!authorityTemplate) throw new NotFoundException('Authority to Act template not found');
    if (!rentalTemplate) throw new NotFoundException('Rental Agreement template not found');

    const [authorityBytes, rentalBytes] = await Promise.all([
      this.storage.getBuffer(authorityTemplate.key),
      this.storage.getBuffer(rentalTemplate.key),
    ]);

    const c = reservation.customer;
    const v = reservation.vehicle;
    const today = new Date().toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const startDate = reservation.startDate
      ? new Date(reservation.startDate).toLocaleDateString('en-AU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : today;

    const fieldValues: Record<string, string> = {
      customer_full_name:   `${c.firstName} ${c.lastName}`,
      customer_address:     c.address ?? '',
      customer_suburb:      c.suburb ?? '',
      customer_state:       c.state ?? '',
      customer_postcode:    c.postcode ?? '',
      customer_phone:       c.phone ?? '',
      customer_email:       c.email ?? '',
      customer_licence:     c.licenceNumber ?? '',
      customer_dob:         c.dob ?? '',
      vehicle_make_model:   v ? `${v.make} ${v.model}` : '',
      vehicle_registration: v?.registration ?? '',
      vehicle_colour:       v?.colour ?? '',
      vehicle_year:         v?.year ? String(v.year) : '',
      vehicle_category:     v?.category ?? '',
      hire_start_date:      startDate,
      file_number:          reservation.fileNumber ?? reservation.reservationNumber ?? '',
      reservation_number:   reservation.reservationNumber ?? '',
      sign_date:            today,
    };

    const fillPdf = async (bytes: Buffer): Promise<string> => {
      const pdfDoc = await PDFDocument.load(bytes);
      const form = pdfDoc.getForm();
      for (const [fieldName, value] of Object.entries(fieldValues)) {
        try {
          const field = form.getTextField(fieldName);
          if (field) field.setText(value);
        } catch {
          // Field not present in this template — skip silently
        }
      }
      const filledBytes = await pdfDoc.save();
      return Buffer.from(filledBytes).toString('base64');
    };

    const [authorityBase64, rentalBase64] = await Promise.all([
      fillPdf(authorityBytes),
      fillPdf(rentalBytes),
    ]);

    return { authorityBase64, rentalBase64 };
  }

  async saveSignedDoc(
    reservationId: string,
    docType: string,
    base64: string,
  ): Promise<{ key: string }> {
    const buffer = Buffer.from(base64, 'base64');
    const key = `hire-documents/${reservationId}/${docType}-signed-${Date.now()}.pdf`;
    await this.storage.upload(key, buffer, 'application/pdf');
    return { key };
  }
}

