import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClaimsService {
  constructor(private prisma: PrismaService) {}

  findAll(branchId?: string) {
    return this.prisma.claim.findMany({
      include: {
        reservation: { include: { customer: true, vehicle: true } },
        insurer: true,
        repairer: true,
        documents: true,
        invoices: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.claim.findUnique({
      where: { id },
      include: {
        reservation: { include: { customer: true, vehicle: { include: { branch: true } } } },
        insurer: true,
        repairer: true,
        documents: true,
        invoices: true,
      },
    });
  }

  create(data: any) {
    return this.prisma.claim.create({
      data: {
        reservation: { connect: { id: data.reservationId } },
        insurer: { connect: { id: data.insurerId } },
        repairer: data.repairerId ? { connect: { id: data.repairerId } } : undefined,
        claimNumber: data.claimNumber,
        notes: data.notes,
      },
      include: {
        reservation: true,
        insurer: true,
        repairer: true,
      },
    });
  }

  update(id: string, data: any) {
    return this.prisma.claim.update({
      where: { id },
      data: {
        status: data.status,
        claimNumber: data.claimNumber,
        notes: data.notes,
      },
      include: {
        reservation: true,
        insurer: true,
        repairer: true,
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
      },
    });
  }
}
