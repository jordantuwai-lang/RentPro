import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FleetService {
  constructor(private prisma: PrismaService) {}

  findAll(branchId?: string) {
    return this.prisma.vehicle.findMany({
      where: branchId ? { branchId } : undefined,
      include: { branch: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        branch: true,
        reservations: {
          include: { customer: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  create(data: any) {
    return this.prisma.vehicle.create({
      data,
      include: { branch: true },
    });
  }

  update(id: string, data: any) {
    return this.prisma.vehicle.update({
      where: { id },
      data,
      include: { branch: true },
    });
  }

  updateStatus(id: string, status: string) {
    return this.prisma.vehicle.update({
      where: { id },
      data: { status: status as any },
      include: { branch: true },
    });
  }

  async getFleetSummary(branchId?: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: branchId ? { branchId } : undefined,
    });

    return {
      total: vehicles.length,
      available: vehicles.filter(v => v.status === 'AVAILABLE').length,
      onHire: vehicles.filter(v => v.status === 'ON_HIRE').length,
      inMaintenance: vehicles.filter(v => v.status === 'IN_MAINTENANCE').length,
      awaitingRepair: vehicles.filter(v => v.status === 'AWAITING_REPAIR').length,
    };
  }
}
