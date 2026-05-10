import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './branches.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.branch.findMany({
      include: { users: true, vehicles: true },
    });
  }

  findOne(id: string) {
    return this.prisma.branch.findUnique({
      where: { id },
      include: { users: true, vehicles: true },
    });
  }

  create(data: CreateBranchDto) {
    return this.prisma.branch.create({ data });
  }

  update(id: string, data: UpdateBranchDto) {
    return this.prisma.branch.update({
      where: { id },
      data,
    });
  }
}
