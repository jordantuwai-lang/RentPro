import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RatesService {
  constructor(private prisma: PrismaService) {}

  findAllClasses() {
    return this.prisma.vehicleClass.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  createClass(data: { code: string; description: string; example?: string; sortOrder?: number }) {
    return this.prisma.vehicleClass.create({ data });
  }

  updateClass(id: string, data: any) {
    return this.prisma.vehicleClass.update({ where: { id }, data });
  }

  async getCurrentRates(branchId: string) {
    const classes = await this.prisma.vehicleClass.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    const now = new Date();
    const rates = await Promise.all(
      classes.map(async (vc) => {
        const rate = await this.prisma.hireRate.findFirst({
          where: { vehicleClassId: vc.id, branchId, effectiveFrom: { lte: now } },
          orderBy: { effectiveFrom: 'desc' },
        });
        return { vehicleClass: vc, rate: rate ?? null };
      }),
    );
    return rates;
  }

  getRateHistory(branchId: string, vehicleClassId: string) {
    return this.prisma.hireRate.findMany({
      where: { branchId, vehicleClassId },
      orderBy: { effectiveFrom: 'desc' },
      include: { vehicleClass: true },
    });
  }

  setRate(data: {
    vehicleClassId: string;
    branchId: string;
    daily?: number;
    weekly?: number;
    monthly?: number;
    effectiveFrom?: string;
    createdBy?: string;
  }) {
    return this.prisma.hireRate.create({
      data: {
        vehicleClassId: data.vehicleClassId,
        branchId: data.branchId,
        daily: data.daily ?? null,
        weekly: data.weekly ?? null,
        monthly: data.monthly ?? null,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
        createdBy: data.createdBy ?? null,
      },
      include: { vehicleClass: true, branch: true },
    });
  }
}
