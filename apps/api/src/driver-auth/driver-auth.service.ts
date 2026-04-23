import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DriverAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { branch: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!['CSE_DRIVER', 'RECOVERY_AGENT'].includes(user.role)) {
      throw new UnauthorizedException('This account does not have driver access');
    }

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        branch: user.branch ? { id: user.branch.id, name: user.branch.name } : null,
      },
    };
  }

  async setPassword(userId: string, password: string) {
    const hash = await bcrypt.hash(password, 12);
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash },
    });
  }

  verifyToken(token: string) {
    return this.jwt.verify(token);
  }
}

