import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ClaimsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  // ─── LIST ────────────────────────────────────────────────────────────────────

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
        accidentDetails: true,
        repairDetails: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!branchId) return claims;
    return claims.filter(
      (c) => c.reservation?.vehicle?.branch?.id === branchId,
    );
  }

  // ─── SINGLE ──────────────────────────────────────────────────────────────────

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
        accidentDetails: true,
        atFaultParty: true,
        repairDetails: true,
        notes: { orderBy: { createdAt: 'desc' } },
        documents: true,
        invoices: true,
      },
    });
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────────

  async create(data: any) {
    const count = await this.prisma.claim.count();
    const claimNumber = `CLM-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.claim.create({
      data: {
        reservation: { connect: { id: data.reservationId } },
        insurer: data.insurerId ? { connect: { id: data.insurerId } } : undefined,
        repairer: data.repairerId ? { connect: { id: data.repairerId } } : undefined,
        claimNumber,
        claimReference: data.claimReference || null,
        claimHandlerName: data.claimHandlerName || null,
        claimHandlerPhone: data.claimHandlerPhone || null,
        claimHandlerEmail: data.claimHandlerEmail || null,
        sourceOfBusiness: data.sourceOfBusiness || null,
        hireType: data.hireType || null,
        typeOfCover: data.typeOfCover || null,
        policyNumber: data.policyNumber || null,
        excessAmount: data.excessAmount ? parseFloat(data.excessAmount) : null,
        liabilityStatus: data.liabilityStatus || 'PENDING',
        liabilityNotes: data.liabilityNotes || null,
        totalLoss: data.totalLoss ?? false,
        towIn: data.towIn ?? false,
        settlementReceived: data.settlementReceived ?? false,
        isDriverOwner: data.isDriverOwner ?? true,
        status: data.status || 'OPEN',
      },
      include: {
        reservation: { include: { customer: true, vehicle: true } },
        insurer: true,
        repairer: true,
        notes: true,
        accidentDetails: true,
        atFaultParty: true,
        repairDetails: true,
      },
    });
  }

  // ─── UPDATE CORE CLAIM ───────────────────────────────────────────────────────

  update(id: string, data: any) {
    return this.prisma.claim.update({
      where: { id },
      data: {
        status: data.status,
        claimNumber: data.claimNumber,
        claimReference: data.claimReference,
        claimHandlerName: data.claimHandlerName,
        claimHandlerPhone: data.claimHandlerPhone,
        claimHandlerEmail: data.claimHandlerEmail,
        sourceOfBusiness: data.sourceOfBusiness,
        hireType: data.hireType || undefined,
        typeOfCover: data.typeOfCover || undefined,
        policyNumber: data.policyNumber,
        excessAmount: data.excessAmount != null ? parseFloat(data.excessAmount) : undefined,
        liabilityStatus: data.liabilityStatus || undefined,
        liabilityNotes: data.liabilityNotes,
        totalLoss: data.totalLoss,
        towIn: data.towIn,
        settlementReceived: data.settlementReceived,
        isDriverOwner: data.isDriverOwner,
        insurer: data.insurerId ? { connect: { id: data.insurerId } } : undefined,
        repairer: data.repairerId ? { connect: { id: data.repairerId } } : undefined,
      },
      include: {
        reservation: { include: { customer: true, vehicle: true } },
        insurer: true,
        repairer: true,
        accidentDetails: true,
        atFaultParty: true,
        repairDetails: true,
        notes: { orderBy: { createdAt: 'desc' } },
        documents: true,
        invoices: true,
      },
    });
  }

  // ─── ACCIDENT DETAILS ────────────────────────────────────────────────────────

  upsertAccidentDetails(claimId: string, data: any) {
    const payload = {
      accidentDate: data.accidentDate ? new Date(data.accidentDate) : null,
      accidentTime: data.accidentTime || null,
      accidentLocation: data.accidentLocation || null,
      accidentDescription: data.accidentDescription || null,
      policeAttended: data.policeAttended ?? false,
      policeEventNo: data.policeEventNo || null,
      policeStation: data.policeStation || null,
      policeContactName: data.policeContactName || null,
      policePhone: data.policePhone || null,
      witnessName: data.witnessName || null,
      witnessPhone: data.witnessPhone || null,
      witnessStatement: data.witnessStatement || null,
    };

    return this.prisma.accidentDetails.upsert({
      where: { claimId },
      create: { claim: { connect: { id: claimId } }, ...payload },
      update: payload,
    });
  }

  // ─── AT FAULT PARTY ──────────────────────────────────────────────────────────

  upsertAtFaultParty(claimId: string, data: any) {
    const payload = {
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      phone: data.phone || null,
      email: data.email || null,
      dateOfBirth: data.dateOfBirth || null,
      streetAddress: data.streetAddress || null,
      suburb: data.suburb || null,
      state: data.state || null,
      postcode: data.postcode || null,
      licenceNumber: data.licenceNumber || null,
      licenceState: data.licenceState || null,
      licenceExpiry: data.licenceExpiry || null,
      vehicleRego: data.vehicleRego || null,
      vehicleMake: data.vehicleMake || null,
      vehicleModel: data.vehicleModel || null,
      vehicleYear: data.vehicleYear ? parseInt(data.vehicleYear) : null,
      vehicleColour: data.vehicleColour || null,
      theirInsurer: data.theirInsurer || null,
      theirPolicyNo: data.theirPolicyNo || null,
      theirClaimNo: data.theirClaimNo || null,
      companyName: data.companyName || null,
      companyABN: data.companyABN || null,
      companyPhone: data.companyPhone || null,
    };

    return this.prisma.atFaultParty.upsert({
      where: { claimId },
      create: { claim: { connect: { id: claimId } }, ...payload },
      update: payload,
    });
  }

  // ─── REPAIR DETAILS ──────────────────────────────────────────────────────────

  upsertRepairDetails(claimId: string, data: any) {
    const payload = {
      estimateDate: data.estimateDate ? new Date(data.estimateDate) : null,
      assessmentDate: data.assessmentDate ? new Date(data.assessmentDate) : null,
      repairStartDate: data.repairStartDate ? new Date(data.repairStartDate) : null,
      repairEndDate: data.repairEndDate ? new Date(data.repairEndDate) : null,
      invoiceNumber: data.invoiceNumber || null,
      invoiceAmount: data.invoiceAmount != null ? parseFloat(data.invoiceAmount) : null,
      authorisedAmount: data.authorisedAmount != null ? parseFloat(data.authorisedAmount) : null,
      thirdPartyRecovery: data.thirdPartyRecovery ?? false,
      recoveryAmount: data.recoveryAmount != null ? parseFloat(data.recoveryAmount) : null,
      repairNotes: data.repairNotes || null,
    };

    return this.prisma.repairDetails.upsert({
      where: { claimId },
      create: { claim: { connect: { id: claimId } }, ...payload },
      update: payload,
    });
  }

  // ─── NOTES ───────────────────────────────────────────────────────────────────

  addNote(claimId: string, data: any) {
    return this.prisma.claimNote.create({
      data: {
        claim: { connect: { id: claimId } },
        note: data.note,
        authorName: data.authorName,
      },
    });
  }

  // ─── DOCUMENTS ───────────────────────────────────────────────────────────────

  addDocument(claimId: string, data: any) {
    return this.prisma.claimDocument.create({
      data: {
        claim: { connect: { id: claimId } },
        name: data.name,
        url: data.url,
        type: data.type || 'OTHER',
      },
    });
  }

  deleteDocument(documentId: string) {
    return this.prisma.claimDocument.delete({ where: { id: documentId } });
  }

  // ─── INVOICES ────────────────────────────────────────────────────────────────

  createInvoice(claimId: string, data: any) {
    return this.prisma.invoice.create({
      data: {
        claim: { connect: { id: claimId } },
        amount: parseFloat(data.amount),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes || null,
      },
    });
  }

  // ─── INSURERS ────────────────────────────────────────────────────────────────

  getInsurerDirectory() {
    return this.prisma.insurer.findMany({ orderBy: { name: 'asc' } });
  }

  createInsurer(data: any) {
    return this.prisma.insurer.create({ data });
  }

  // ─── REPAIRERS ───────────────────────────────────────────────────────────────

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

  // ─── REPAIRER DOCUMENTS (R2) ─────────────────────────────────────────────────

  async getRepairerDocuments(repairerId: string) {
    const docs = await this.prisma.repairerDocument.findMany({
      where: { repairerId },
      orderBy: { createdAt: 'desc' },
    });
    // Strip fileData — never return base64 blobs in list responses
    return docs.map(({ fileData, ...rest }) => rest);
  }

  async getRepairerDocumentUrl(docId: string): Promise<{ url: string } | null> {
    const doc = await this.prisma.repairerDocument.findUnique({
      where: { id: docId },
    });
    if (!doc) return null;
    // If doc has an R2 key, generate presigned URL
    if (doc.key) {
      const url = await this.storage.getPresignedUrl(doc.key);
      return { url };
    }
    // Legacy fallback: doc still has base64 fileData, return as data URL
    if (doc.fileData) {
      return { url: `data:${doc.mimeType};base64,${doc.fileData}` };
    }
    return null;
  }

  async addRepairerDocument(
    repairerId: string,
    name: string,
    buffer: Buffer,
    mimeType: string,
  ) {
    const ext = mimeType.split('/')[1] || 'bin';
    const key = `repairer-docs/${repairerId}/${Date.now()}-${name.replace(/\s+/g, '-')}.${ext}`;

    await this.storage.upload(key, buffer, mimeType);

    return this.prisma.repairerDocument.create({
      data: {
        repairer: { connect: { id: repairerId } },
        name,
        key,
        fileData: '', // empty — file lives in R2
        mimeType,
      },
    });
  }

  async deleteRepairerDocument(documentId: string) {
    const doc = await this.prisma.repairerDocument.findUnique({
      where: { id: documentId },
    });
    // Delete from R2 if it has a key
    if (doc?.key) {
      try {
        await this.storage.delete(doc.key);
      } catch {
        // Non-fatal — still delete the DB record
      }
    }
    return this.prisma.repairerDocument.delete({ where: { id: documentId } });
  }
}
