import { Injectable, NotFoundException } from '@nestjs/common';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: any) {
    const params: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      emailAddress: [data.email],
      publicMetadata: {
        role: data.role,
        branchId: data.branchId || null,
      },
    };

    if (data.password) {
      params.password = data.password;
      params.skipPasswordChecks = false;
    }

    const clerkUser = await clerkClient.users.createUser(params);

    await this.prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        branchId: data.branchId || null,
      },
    });

    return clerkUser;
  }

  async deleteUser(clerkId: string) {
    await clerkClient.users.deleteUser(clerkId);
    await this.prisma.user.deleteMany({ where: { clerkId } });
    return { success: true };
  }

  async listUsers() {
    const clerkUsers = await clerkClient.users.getUserList({ limit: 100 });
    const dbUsers = await this.prisma.user.findMany({
      include: { branch: true },
    });

    const userList = Array.isArray(clerkUsers) ? clerkUsers : (clerkUsers as any).data || [];
    return userList.map((cu: any) => {
      const dbUser = dbUsers.find(u => u.clerkId === cu.id);
      return {
        clerkId: cu.id,
        firstName: cu.firstName,
        lastName: cu.lastName,
        email: cu.emailAddresses[0]?.emailAddress,
        role: cu.publicMetadata?.role || 'No role',
        branch: dbUser?.branch?.name || '—',
        createdAt: cu.createdAt,
      };
    });
  }
}
