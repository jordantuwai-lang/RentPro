import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

const mockPrisma = {
  vehicle: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  vehiclePhoto: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

const mockStorage = {
  getPresignedUrl: jest.fn().mockResolvedValue('https://example.com/photo.jpg'),
  upload: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
};

describe('FleetService', () => {
  let service: FleetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FleetService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<FleetService>(FleetService);
    jest.clearAllMocks();
  });

  // ─── getFleetSummary ──────────────────────────────────────────────────────────

  describe('getFleetSummary', () => {
    const v = (status: string) => ({ id: Math.random().toString(36), status });

    it('counts all status buckets correctly', async () => {
      mockPrisma.vehicle.findMany.mockResolvedValue([
        v('AVAILABLE'), v('AVAILABLE'),
        v('ON_HIRE'),
        v('IN_REPAIR'), v('BOOKED_FOR_REPAIR'),
        v('IN_SERVICE'), v('BOOKED_FOR_SERVICE'),
        v('NOT_AVAILABLE'), v('WITH_STAFF'), v('CLEAN_NEEDED'),
      ]);

      const summary = await service.getFleetSummary();

      expect(summary.total).toBe(10);
      expect(summary.available).toBe(2);
      expect(summary.onHire).toBe(1);
      expect(summary.inRepair).toBe(2);     // IN_REPAIR + BOOKED_FOR_REPAIR
      expect(summary.inService).toBe(2);    // IN_SERVICE + BOOKED_FOR_SERVICE
      expect(summary.notAvailable).toBe(3); // NOT_AVAILABLE + WITH_STAFF + CLEAN_NEEDED
    });

    it('returns all zeros for an empty fleet', async () => {
      mockPrisma.vehicle.findMany.mockResolvedValue([]);

      const summary = await service.getFleetSummary();

      expect(summary).toEqual({ total: 0, available: 0, onHire: 0, inRepair: 0, inService: 0, notAvailable: 0 });
    });

    it('filters by branchId when provided', async () => {
      mockPrisma.vehicle.findMany.mockResolvedValue([v('AVAILABLE')]);

      await service.getFleetSummary('branch-123');

      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { branchId: 'branch-123' } }),
      );
    });

    it('does not filter when branchId is "all"', async () => {
      mockPrisma.vehicle.findMany.mockResolvedValue([]);

      await service.getFleetSummary('all');

      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });
  });

  // ─── addPhoto ─────────────────────────────────────────────────────────────────

  describe('addPhoto', () => {
    it('throws NotFoundException when vehicle does not exist', async () => {
      mockPrisma.vehicle.findUnique.mockResolvedValue(null);

      await expect(
        service.addPhoto('bad-id', { fileData: 'abc', mimeType: 'image/jpeg' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when vehicle already has 10 photos', async () => {
      mockPrisma.vehicle.findUnique.mockResolvedValue({ id: 'veh-1' });
      mockPrisma.vehiclePhoto.count.mockResolvedValue(10);

      await expect(
        service.addPhoto('veh-1', { fileData: 'abc', mimeType: 'image/jpeg' }),
      ).rejects.toThrow('Maximum of 10 photos allowed per vehicle');
    });

    it('uploads to storage and creates a photo record', async () => {
      mockPrisma.vehicle.findUnique.mockResolvedValue({ id: 'veh-1' });
      mockPrisma.vehiclePhoto.count.mockResolvedValue(3);
      mockPrisma.vehiclePhoto.create.mockResolvedValue({ id: 'photo-1', vehicleId: 'veh-1', key: 'some/key' });

      const result = await service.addPhoto('veh-1', {
        fileData: Buffer.from('fake-image').toString('base64'),
        mimeType: 'image/jpeg',
        caption: 'Front view',
      });

      expect(mockStorage.upload).toHaveBeenCalled();
      expect(mockPrisma.vehiclePhoto.create).toHaveBeenCalled();
      expect(result.vehicleId).toBe('veh-1');
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a vehicle with all required fields', async () => {
      const dto = {
        make: 'Toyota',
        model: 'Corolla',
        year: 2022,
        registration: 'ABC123',
        colour: 'White',
        state: 'VIC',
        category: 'Small',
        status: 'AVAILABLE' as any,
        branchId: 'branch-1',
      };

      mockPrisma.vehicle.create.mockResolvedValue({ id: 'veh-new', ...dto });

      const result = await service.create(dto);

      expect(mockPrisma.vehicle.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            make: 'Toyota',
            registration: 'ABC123',
            branch: { connect: { id: 'branch-1' } },
          }),
        }),
      );
      expect(result.make).toBe('Toyota');
    });

    it('defaults colour and state to empty string when omitted', async () => {
      const dto = {
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        registration: 'XYZ999',
        status: 'AVAILABLE' as any,
        branchId: 'branch-1',
      };

      mockPrisma.vehicle.create.mockResolvedValue({ id: 'veh-new', colour: '', state: '' });

      await service.create(dto);

      expect(mockPrisma.vehicle.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ colour: '', state: '' }),
        }),
      );
    });
  });
});
