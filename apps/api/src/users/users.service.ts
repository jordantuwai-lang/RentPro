import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      include: { branch: true },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { branch: true },
    });
  }

  create(data: any) {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  // ─── Driver location ──────────────────────────────────────────────────────────

  updateLocation(id: string, lat: number, lng: number) {
    return this.prisma.user.update({
      where: { id },
      data: {
        lat,
        lng,
        locationUpdatedAt: new Date(),
      },
      select: { id: true, lat: true, lng: true, locationUpdatedAt: true },
    });
  }

  // Returns all CSE_DRIVER users with a location reported in the last 2 hours
  getDriverLocations() {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    return this.prisma.user.findMany({
      where: {
        role: 'CSE_DRIVER',
        lat: { not: null },
        lng: { not: null },
        locationUpdatedAt: { gte: twoHoursAgo },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        lat: true,
        lng: true,
        locationUpdatedAt: true,
        branch: { select: { name: true } },
      },
    });
  }
}

