import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  getChargeTypes() {
    return this.prisma.chargeType.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  createChargeType(data: any) {
    return this.prisma.chargeType.create({ data });
  }

  updateChargeType(id: string, data: any) {
    return this.prisma.chargeType.update({ where: { id }, data });
  }

  getPayments(reservationId?: string) {
    return this.prisma.payment.findMany({
      where: reservationId ? { reservationId } : undefined,
      include: {
        reservation: { include: { customer: true, vehicle: { include: { branch: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  createPayment(data: any) {
    return this.prisma.payment.create({
      data: {
        reservation: { connect: { id: data.reservationId } },
        chargeType: data.chargeType,
        description: data.description || null,
        amount: parseFloat(data.amount),
        status: 'PENDING',
        cardReference: data.cardReference || null,
      },
      include: {
        reservation: { include: { customer: true } },
      },
    });
  }

  processPayment(id: string, data: any) {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status: 'PAID',
        method: data.method,
        processedBy: data.processedBy,
        processedAt: new Date(),
      },
    });
  }

  deletePayment(id: string) {
    return this.prisma.payment.delete({ where: { id } });
  }

  searchReservations(query: string) {
    return this.prisma.reservation.findMany({
      where: {
        OR: [
          { reservationNumber: { contains: query, mode: 'insensitive' } },
          { fileNumber: { contains: query, mode: 'insensitive' } },
          { customer: { firstName: { contains: query, mode: 'insensitive' } } },
          { customer: { lastName: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        customer: true,
        vehicle: { include: { branch: true } },
        payments: true,
      },
      take: 10,
    });
  }
}
