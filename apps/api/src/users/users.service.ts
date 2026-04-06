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
}
