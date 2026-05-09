import { Test, TestingModule } from '@nestjs/testing';
import { ClaimsService } from './claims.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

const mockPrisma = {
  claim: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  accidentDetails: {
    upsert: jest.fn(),
  },
  atFaultParty: {
    upsert: jest.fn(),
  },
  repairDetails: {
    upsert: jest.fn(),
  },
  claimNote: {
    create: jest.fn(),
  },
  claimDocument: {
    create: jest.fn(),
    delete: jest.fn(),
  },
  invoice: {
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  insurer: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  repairer: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  repairerDocument: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

const mockStorage = {
  getPresignedUrl: jest.fn().mockResolvedValue('https://example.com/doc.pdf'),
  upload: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
};

describe('ClaimsService', () => {
  let service: ClaimsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<ClaimsService>(ClaimsService);
    jest.clearAllMocks();
  });

  // ─── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('generates a zero-padded CLM number based on current count', async () => {
      mockPrisma.claim.count.mockResolvedValue(42);
      mockPrisma.claim.create.mockResolvedValue({ id: 'clm-1', claimNumber: 'CLM-000043' });

      await service.create({ reservationId: 'res-1' } as any);

      expect(mockPrisma.claim.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ claimNumber: 'CLM-000043' }),
        }),
      );
    });

    it('defaults liabilityStatus to PENDING when not provided', async () => {
      mockPrisma.claim.count.mockResolvedValue(0);
      mockPrisma.claim.create.mockResolvedValue({ id: 'clm-1' });

      await service.create({ reservationId: 'res-1' } as any);

      expect(mockPrisma.claim.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ liabilityStatus: 'PENDING' }),
        }),
      );
    });

    it('defaults status to OPEN when not provided', async () => {
      mockPrisma.claim.count.mockResolvedValue(0);
      mockPrisma.claim.create.mockResolvedValue({ id: 'clm-1' });

      await service.create({ reservationId: 'res-1' } as any);

      expect(mockPrisma.claim.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'OPEN' }),
        }),
      );
    });
  });

  // ─── createInvoice ────────────────────────────────────────────────────────────

  describe('createInvoice', () => {
    it('auto-generates an invoice number when none is provided', async () => {
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockResolvedValue({ id: 'inv-1', invoiceNumber: 'INV-ABCDEF-001' });
      mockPrisma.claim.update.mockResolvedValue({});

      await service.createInvoice('clm-abcdef', { amount: 1500 } as any);

      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ invoiceNumber: expect.stringMatching(/^INV-/) }),
        }),
      );
    });

    it('uses a caller-supplied invoice number when provided', async () => {
      mockPrisma.invoice.count.mockResolvedValue(2);
      mockPrisma.invoice.create.mockResolvedValue({ id: 'inv-1', invoiceNumber: 'CUSTOM-001' });
      mockPrisma.claim.update.mockResolvedValue({});

      await service.createInvoice('clm-1', { amount: 500, invoiceNumber: 'CUSTOM-001' } as any);

      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ invoiceNumber: 'CUSTOM-001' }),
        }),
      );
    });

    it('moves the claim to CLOSED after creating the invoice', async () => {
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockResolvedValue({ id: 'inv-1' });
      mockPrisma.claim.update.mockResolvedValue({});

      await service.createInvoice('clm-1', { amount: 1000 } as any);

      expect(mockPrisma.claim.update).toHaveBeenCalledWith({
        where: { id: 'clm-1' },
        data: { status: 'CLOSED' },
      });
    });
  });

  // ─── findAll — branch filtering ───────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all claims when no branchId is supplied', async () => {
      const claims = [
        { id: 'clm-1', reservation: { vehicle: { branch: { id: 'branch-a' } } } },
        { id: 'clm-2', reservation: { vehicle: { branch: { id: 'branch-b' } } } },
      ];
      mockPrisma.claim.findMany.mockResolvedValue(claims);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
    });

    it('filters claims by branchId when provided', async () => {
      const claims = [
        { id: 'clm-1', reservation: { vehicle: { branch: { id: 'branch-a' } } } },
        { id: 'clm-2', reservation: { vehicle: { branch: { id: 'branch-b' } } } },
      ];
      mockPrisma.claim.findMany.mockResolvedValue(claims);

      const result = await service.findAll('branch-a');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('clm-1');
    });
  });

  // ─── addNote ──────────────────────────────────────────────────────────────────

  describe('addNote', () => {
    it('creates a note linked to the claim', async () => {
      mockPrisma.claimNote.create.mockResolvedValue({ id: 'note-1', note: 'Test note', authorName: 'Alice' });

      const result = await service.addNote('clm-1', { note: 'Test note', authorName: 'Alice' });

      expect(mockPrisma.claimNote.create).toHaveBeenCalledWith({
        data: {
          claim: { connect: { id: 'clm-1' } },
          note: 'Test note',
          authorName: 'Alice',
        },
      });
      expect(result.note).toBe('Test note');
    });
  });

  // ─── upsertAccidentDetails ────────────────────────────────────────────────────

  describe('upsertAccidentDetails', () => {
    it('parses accidentDate from string to Date', async () => {
      mockPrisma.accidentDetails.upsert.mockResolvedValue({ id: 'acc-1' });

      await service.upsertAccidentDetails('clm-1', {
        accidentDate: '2024-03-15',
        policeAttended: true,
      } as any);

      expect(mockPrisma.accidentDetails.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            accidentDate: new Date('2024-03-15'),
          }),
        }),
      );
    });

    it('sets accidentDate to null when not provided', async () => {
      mockPrisma.accidentDetails.upsert.mockResolvedValue({ id: 'acc-1' });

      await service.upsertAccidentDetails('clm-1', {} as any);

      expect(mockPrisma.accidentDetails.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ accidentDate: null }),
        }),
      );
    });
  });
});
