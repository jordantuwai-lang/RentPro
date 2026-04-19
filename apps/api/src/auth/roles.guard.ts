import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

const prisma = new PrismaClient();

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles() decorator on this route — allow through
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user?.sub) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Look up the user's role from our DB using their Clerk ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.sub },
      select: { role: true },
    });

    if (!dbUser || !requiredRoles.includes(dbUser.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
