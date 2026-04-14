import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClaimsService {
  constructor(private prisma: PrismaService) {}

  async findAll(branchId?: string) {
    const claims = await this.prisma.claim.findMany({
      include: {
        reservation: {
          include: {
            customer: true,
            vehicle: { include: { branch: true } },
          },
        },
        insurer: true,
        repairer: true,
        notes: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!branchId) return claims;

    return claims.filter(
      (c) => c.reservation?.vehicle?.branch?.id === branchId,
    );
  }

  findOne(id: string) {
    return this.prisma.claim.findUnique({
      where: { id },
      include: {
        reservation: {
          include: {
            customer: true,
            vehicle: { include: { branch: true } },
          },
        },
        insurer: true,
        repairer: true,
        notes: { orderBy: { createdAt: 'desc' } },
        documents: true,
        invoices: true,
      },
    });
  }

  async create(data: any) {
    const count = await this.prisma.claim.count();
    const claimNumber = `CLM-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.claim.create({
      data: {
        reservation: { connect: { id: data.reservationId } },
        insurer: data.insurerId ? { connect: { id: data.insurerId } } : undefined,
        repairer: data.repairerId ? { connect: { id: data.repairerId } } : undefined,
        claimNumber,
        claimReference: data.claimReference,
        sourceOfBusiness: data.sourceOfBusiness,
        claimHandlerId: data.claimHandlerId,
        status: data.status || 'OPEN',
      },
      include: {
        reservation: { include: { customer: true, vehicle: true } },
        insurer: true,
        repairer: true,
        notes: true,
      },
    });
  }

  update(id: string, data: any) {
    return this.prisma.claim.update({
      where: { id },
      data: {
        status: data.status,
        claimNumber: data.claimNumber,
        claimReference: data.claimReference,
        sourceOfBusiness: data.sourceOfBusiness,
        claimHandlerId: data.claimHandlerId,
        insurer: data.insurerId ? { connect: { id: data.insurerId } } : undefined,
        repairer: data.repairerId ? { connect: { id: data.repairerId } } : undefined,
      },
      include: {
        reservation: { include: { customer: true, vehicle: true } },
        insurer: true,
        repairer: true,
        notes: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  addNote(claimId: string, data: any) {
    return this.prisma.claimNote.create({
      data: {
        claim: { connect: { id: claimId } },
        note: data.note,
        authorName: data.authorName,
      },
    });
  }

  addDocument(claimId: string, data: any) {
    return this.prisma.document.create({
      data: {
        claim: { connect: { id: claimId } },
        name: data.name,
        url: data.url,
        type: data.type,
      },
    });
  }

  createInvoice(claimId: string, data: any) {
    return this.prisma.invoice.create({
      data: {
        claim: { connect: { id: claimId } },
        amount: data.amount,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes,
      },
    });
  }

  getInsurerDirectory() {
    return this.prisma.insurer.findMany({ orderBy: { name: 'asc' } });
  }

  createInsurer(data: any) {
    return this.prisma.insurer.create({ data });
  }

  getRepairerDirectory() {
    return this.prisma.repairer.findMany({ orderBy: { name: 'asc' } });
  }

  createRepairer(data: any) {
    return this.prisma.repairer.create({ data });
  }

  updateRepairer(id: string, data: any) {
    return this.prisma.repairer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address,
        suburb: data.suburb,
        postcode: data.postcode || undefined,
        state: data.state || undefined,
        territory: data.territory || undefined,
        branchId: data.branchId || undefined,
        paymentType: data.paymentType || undefined,
        bsb: data.bsb || undefined,
        accountNumber: data.accountNumber || undefined,
        accountName: data.accountName || undefined,
        bankName: data.bankName || undefined,
        referralAmount: data.referralAmount ? parseFloat(data.referralAmount) : undefined,
        paymentFrequency: data.paymentFrequency || undefined,
      },
    });
  }

  getRepairerDocuments(repairerId: string) {
    return this.prisma.repairerDocument.findMany({
      where: { repairerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  addRepairerDocument(repairerId: string, data: any) {
    return this.prisma.repairerDocument.create({
      data: {
        repairer: { connect: { id: repairerId } },
        name: data.name,
        fileData: data.fileData,
        mimeType: data.mimeType,
      },
    });
  }

  deleteRepairerDocument(documentId: string) {
    return this.prisma.repairerDocument.delete({
      where: { id: documentId },
    });
  }
}