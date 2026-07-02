import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ReservationStatus } from './reservations.dto';

const mockStorage = {
  upload: jest.fn(),
  getPresignedUrl: jest.fn(),
  getBuffer: jest.fn(),
  delete: jest.fn(),
};

const mockPrisma = {
  $transaction: jest.fn(),
  reservationCounter: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
  fileNumberCounter: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  accidentDetails: {
    update: jest.fn(),
    create: jest.fn(),
  },
  atFaultParty: {
    update: jest.fn(),
    create: jest.fn(),
  },
  reservation: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  vehicle: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  claim: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  paymentCard: {
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  additionalDriver: {
    create: jest.fn(),
    delete: jest.fn(),
  },
  reservationNote: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  delivery: {
    upsert: jest.fn(),
  },
};

describe('ReservationsService', () => {
  let service: ReservationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    jest.clearAllMocks();
  });

  // ─── generateReservationNumber ────────────────────────────────────────────────

  describe('generateReservationNumber', () => {
    it('increments an existing counter and returns REZ{n}', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          reservationCounter: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, current: 1050 }),
            create: jest.fn(),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      const result = await service.generateReservationNumber();
      expect(result).toBe('REZ1051');
    });

    it('creates counter at 1000 when none exists and returns REZ1001', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          reservationCounter: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 1, current: 1000 }),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      const result = await service.generateReservationNumber();
      expect(result).toBe('REZ1001');
    });
  });

  // ─── generateFileNumber ───────────────────────────────────────────────────────

  describe('generateFileNumber', () => {
    it('generates a KPK-prefixed file number', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          fileNumberCounter: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, KPK: 42, COB: 10 }),
            create: jest.fn(),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      const result = await service.generateFileNumber('KPK');
      expect(result).toBe('KPKRP-43');
    });

    it('generates a COB-prefixed file number', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          fileNumberCounter: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, KPK: 5, COB: 7 }),
            create: jest.fn(),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      const result = await service.generateFileNumber('COB');
      expect(result).toBe('COBRP-8');
    });
  });

  // ─── generateCardReference ────────────────────────────────────────────────────

  describe('generateCardReference', () => {
    it('returns a code starting with CARD-', () => {
      const ref = service.generateCardReference();
      expect(ref).toMatch(/^CARD-[A-Z0-9]{6}$/);
    });

    it('generates unique codes on successive calls', () => {
      const refs = new Set(Array.from({ length: 20 }, () => service.generateCardReference()));
      expect(refs.size).toBeGreaterThan(15);
    });
  });

  // ─── cancel ───────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('throws NotFoundException when reservation does not exist', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(service.cancel('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('frees the vehicle and sets status CANCELLED', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        id: 'res-1',
        vehicleId: 'veh-1',
      });
      mockPrisma.vehicle.update.mockResolvedValue({});
      mockPrisma.reservation.update.mockResolvedValue({ id: 'res-1', status: 'CANCELLED' });

      await service.cancel('res-1');

      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: 'veh-1' },
        data: { status: 'AVAILABLE' },
      });
      expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'CANCELLED' }) }),
      );
    });

    it('does not attempt vehicle update when no vehicle is assigned', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({ id: 'res-2', vehicleId: null });
      mockPrisma.reservation.update.mockResolvedValue({ id: 'res-2', status: 'CANCELLED' });

      await service.cancel('res-2');

      expect(mockPrisma.vehicle.update).not.toHaveBeenCalled();
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    beforeEach(() => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          reservationCounter: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, current: 1000 }),
            create: jest.fn(),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });
    });

    it('throws BadRequestException when vehicle is not AVAILABLE', async () => {
      mockPrisma.reservation.create.mockResolvedValue({ id: 'res-1', vehicleId: 'veh-1' });
      mockPrisma.vehicle.findUnique.mockResolvedValue({ id: 'veh-1', status: 'ON_HIRE' });
      mockPrisma.claim.create.mockResolvedValue({});

      await expect(
        service.create({ vehicleId: 'veh-1', driver: { firstName: 'Jane' } as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('sets vehicle to ON_HIRE when non-draft reservation is created with a vehicle', async () => {
      mockPrisma.reservation.create.mockResolvedValue({ id: 'res-1', vehicleId: 'veh-1' });
      mockPrisma.vehicle.findUnique.mockResolvedValue({ id: 'veh-1', status: 'AVAILABLE' });
      mockPrisma.vehicle.update.mockResolvedValue({});
      mockPrisma.claim.create.mockResolvedValue({});

      await service.create({ vehicleId: 'veh-1', status: ReservationStatus.PENDING, driver: { firstName: 'Jane' } as any });

      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: 'veh-1' },
        data: { status: 'ON_HIRE' },
      });
    });

    it('does not change vehicle status for a DRAFT reservation', async () => {
      mockPrisma.reservation.create.mockResolvedValue({ id: 'res-1', vehicleId: 'veh-1' });
      mockPrisma.claim.create.mockResolvedValue({});

      await service.create({ vehicleId: 'veh-1', status: ReservationStatus.DRAFT, driver: {} as any });

      expect(mockPrisma.vehicle.update).not.toHaveBeenCalled();
    });
  });

  // ─── update — status transitions ─────────────────────────────────────────────

  describe('update — COMPLETED status', () => {
    const baseReservation = {
      id: 'res-1',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      claim: { id: 'clm-1', status: 'OPEN', accidentDetails: null, atFaultParty: null, repairDetails: null },
      customer: { id: 'cust-1' },
    };

    it('frees the vehicle when reservation is completed', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.vehicle.update.mockResolvedValue({});
      mockPrisma.claim.findUnique.mockResolvedValue({ id: 'clm-1', status: 'OPEN' });
      mockPrisma.claim.update.mockResolvedValue({});
      mockPrisma.reservation.update.mockResolvedValue({ ...baseReservation, status: 'COMPLETED' });

      await service.update('res-1', { status: ReservationStatus.COMPLETED });

      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: 'veh-1' },
        data: { status: 'AVAILABLE' },
      });
    });

    it('moves linked claim to INVOICING when reservation is completed', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(baseReservation);
      mockPrisma.vehicle.update.mockResolvedValue({});
      mockPrisma.claim.findUnique.mockResolvedValue({ id: 'clm-1', status: 'OPEN' });
      mockPrisma.claim.update.mockResolvedValue({});
      mockPrisma.reservation.update.mockResolvedValue({ ...baseReservation, status: 'COMPLETED' });

      await service.update('res-1', { status: ReservationStatus.COMPLETED });

      expect(mockPrisma.claim.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'INVOICING' }) }),
      );
    });

    it('does not update claim when claim is already CLOSED', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...baseReservation,
        claim: { ...baseReservation.claim, status: 'CLOSED' },
      });
      mockPrisma.vehicle.update.mockResolvedValue({});
      mockPrisma.claim.findUnique.mockResolvedValue({ id: 'clm-1', status: 'CLOSED' });
      mockPrisma.reservation.update.mockResolvedValue({ ...baseReservation, status: 'COMPLETED' });

      await service.update('res-1', { status: ReservationStatus.COMPLETED });

      expect(mockPrisma.claim.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when reservation does not exist', async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);
      await expect(service.update('bad-id', { status: ReservationStatus.COMPLETED })).rejects.toThrow(NotFoundException);
    });
  });

  // ─── markOnHire ───────────────────────────────────────────────────────────────

  describe('markOnHire', () => {
    it('sets vehicle to ON_HIRE and reservation to ACTIVE', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          fileNumberCounter: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, KPK: 10, COB: 5 }),
            create: jest.fn(),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });
      mockPrisma.reservation.findUnique.mockResolvedValue({
        id: 'res-1',
        vehicleId: 'veh-1',
        sourceOfBusiness: null,
        vehicle: { branch: { code: 'KPK' } },
      });
      mockPrisma.vehicle.update.mockResolvedValue({});
      mockPrisma.reservation.update.mockResolvedValue({ id: 'res-1', status: 'ACTIVE', fileNumber: 'KPKRP-11' });
      mockPrisma.claim.findUnique.mockResolvedValue(null);
      mockPrisma.claim.count.mockResolvedValue(5);
      mockPrisma.claim.create.mockResolvedValue({});

      const result = await service.markOnHire('res-1', {});

      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: 'veh-1' },
        data: { status: 'ON_HIRE' },
      });
      expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'ACTIVE' }) }),
      );
    });

    it('auto-creates a claim when none exists', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          fileNumberCounter: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, KPK: 1, COB: 0 }),
            create: jest.fn(),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });
      mockPrisma.reservation.findUnique.mockResolvedValue({
        id: 'res-1',
        vehicleId: 'veh-1',
        sourceOfBusiness: null,
        vehicle: { branch: { code: 'KPK' } },
      });
      mockPrisma.vehicle.update.mockResolvedValue({});
      mockPrisma.reservation.update.mockResolvedValue({ id: 'res-1', status: 'ACTIVE' });
      mockPrisma.claim.findUnique.mockResolvedValue(null);
      mockPrisma.claim.count.mockResolvedValue(0);
      mockPrisma.claim.create.mockResolvedValue({});

      await service.markOnHire('res-1', {});

      expect(mockPrisma.claim.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ claimNumber: 'CLM-000001', status: 'OPEN' }),
        }),
      );
    });

    it('does not create a claim when one already exists', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          fileNumberCounter: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, KPK: 1, COB: 0 }),
            create: jest.fn(),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });
      mockPrisma.reservation.findUnique.mockResolvedValue({
        id: 'res-1',
        vehicleId: 'veh-1',
        sourceOfBusiness: null,
        vehicle: { branch: { code: 'KPK' } },
      });
      mockPrisma.vehicle.update.mockResolvedValue({});
      mockPrisma.reservation.update.mockResolvedValue({ id: 'res-1', status: 'ACTIVE' });
      mockPrisma.claim.findUnique.mockResolvedValue({ id: 'clm-existing' });

      await service.markOnHire('res-1', {});

      expect(mockPrisma.claim.create).not.toHaveBeenCalled();
    });
  });
});
