import { Injectable } from '@nestjs/common';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { PrismaService } from '../prisma/prisma.service';
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
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
    let clerkUser;
    try {
      clerkUser = await clerk.users.createUser(params);
    } catch (err: any) {
      const clerkMessage = err?.errors?.[0]?.message || 'Failed to create user';
      throw new Error(clerkMessage);
    }
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
  async updateUser(clerkId: string, data: any) {
    const branchId = data.branchId && data.branchId !== '' ? data.branchId : null;
    await clerk.users.updateUser(clerkId, {
      firstName: data.firstName,
      lastName: data.lastName,
      publicMetadata: {
        role: data.role,
        branchId: branchId,
      },
    });
    await this.prisma.user.updateMany({
      where: { clerkId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        branchId: branchId,
      },
    });
    return { success: true };
  }
  async deleteUser(clerkId: string) {
    await clerk.users.deleteUser(clerkId);
    await this.prisma.user.deleteMany({ where: { clerkId } });
    return { success: true };
  }
  async listUsers() {
    const clerkUsers = await clerk.users.getUserList({ limit: 100 });
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
        branchId: dbUser?.branchId || '',
        createdAt: cu.createdAt,
      };
    });
  }
}
