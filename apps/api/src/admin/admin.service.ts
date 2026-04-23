import * as bcrypt from 'bcrypt';
import { Injectable, Logger } from '@nestjs/common';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { $Enums } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './admin.dto';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export interface ClerkUserRecord {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
  publicMetadata: Record<string, unknown>;
  createdAt: number;
}

export interface UserListItem {
  clerkId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | undefined;
  role: string;
  branch: string;
  branchId: string;
  createdAt: number;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async createUser(data: CreateUserDto): Promise<ClerkUserRecord> {
    const params: {
      firstName: string;
      lastName: string;
      emailAddress: string[];
      publicMetadata: Record<string, unknown>;
      password?: string;
      skipPasswordChecks?: boolean;
    } = {
      firstName: data.firstName,
      lastName: data.lastName,
      emailAddress: [data.email],
      publicMetadata: {
        role: data.role,
        branchId: data.branchId ?? null,
      },
    };

    if (data.password) {
      params.password = data.password;
      params.skipPasswordChecks = false;
    }

    let clerkUser: ClerkUserRecord;
    try {
      clerkUser = await clerk.users.createUser(params) as unknown as ClerkUserRecord;
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ message: string }> };
      const message = clerkErr?.errors?.[0]?.message ?? 'Failed to create user';
      throw new Error(message);
    }

    await this.prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        // data.role is already $Enums.Role — Prisma accepts it directly
        role: data.role as $Enums.Role,
        ...(data.password ? { passwordHash: await bcrypt.hash(data.password, 12) } : {}),
        branchId: data.branchId ?? null,
      },
    });

    return clerkUser;
  }

  async updateUser(clerkId: string, data: UpdateUserDto): Promise<{ success: boolean }> {
    const branchId = data.branchId && data.branchId !== '' ? data.branchId : null;

    await clerk.users.updateUser(clerkId, {
      firstName: data.firstName,
      lastName: data.lastName,
      publicMetadata: {
        role: data.role,
        branchId,
      },
    });

    await this.prisma.user.updateMany({
      where: { clerkId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as $Enums.Role,
        branchId,
      },
    });

    return { success: true };
  }

  async deleteUser(clerkId: string): Promise<{ success: boolean }> {
    await clerk.users.deleteUser(clerkId);
    await this.prisma.user.deleteMany({ where: { clerkId } });
    return { success: true };
  }

  async listUsers(): Promise<UserListItem[]> {
    const clerkResponse = await clerk.users.getUserList({ limit: 100 });
    const dbUsers = await this.prisma.user.findMany({ include: { branch: true } });

    const clerkUsers: ClerkUserRecord[] = Array.isArray(clerkResponse)
      ? (clerkResponse as unknown as ClerkUserRecord[])
      : ((clerkResponse as unknown as { data: ClerkUserRecord[] }).data ?? []);

    return clerkUsers.map((cu) => {
      const dbUser = dbUsers.find((u) => u.clerkId === cu.id);
      return {
        clerkId: cu.id,
        firstName: cu.firstName,
        lastName: cu.lastName,
        email: cu.emailAddresses[0]?.emailAddress,
        role: (cu.publicMetadata?.role as string) ?? 'No role',
        branch: dbUser?.branch?.name ?? '—',
        branchId: dbUser?.branchId ?? '',
        createdAt: cu.createdAt,
      };
    });
  }
}

