import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleClassDto, UpdateVehicleClassDto, SetRateDto } from './rates.dto';

@Injectable()
export class RatesService {
  constructor(private prisma: PrismaService) {}

  findAllClasses() {
    return this.prisma.vehicleClass.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  createClass(data: CreateVehicleClassDto) {
    return this.prisma.vehicleClass.create({ data });
  }

  updateClass(id: string, data: UpdateVehicleClassDto) {
    return this.prisma.vehicleClass.update({ where: { id }, data });
  }

  async getCurrentRates(branchId: string) {
    const now = new Date();

    const [classes, allRates] = await Promise.all([
      this.prisma.vehicleClass.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.hireRate.findMany({
        where: { branchId, effectiveFrom: { lte: now } },
        orderBy: { effectiveFrom: 'desc' },
      }),
    ]);

    // For each class, pick the most recent rate (first match after ordering desc)
    return classes.map((vc) => ({
      vehicleClass: vc,
      rate: allRates.find((r) => r.vehicleClassId === vc.id) ?? null,
    }));
  }

  getRateHistory(branchId: string, vehicleClassId: string) {
    return this.prisma.hireRate.findMany({
      where: { branchId, vehicleClassId },
      orderBy: { effectiveFrom: 'desc' },
      include: { vehicleClass: true },
    });
  }

  setRate(data: SetRateDto) {
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
