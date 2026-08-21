import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthTokens, JwtPayload, UserRole } from '@kabootar/shared';

import { PrismaService } from '../../../infrastructure/prisma/prisma.module';
import { LoginDto } from '../presentation/dto/login.dto';
import { RegisterDto } from '../presentation/dto/register.dto';
import {
  generateRefreshToken,
  getRefreshTokenExpiry,
  hashToken,
} from '../infrastructure/token.util';

const USER_WITH_ROLE_SELECT = {
  id: true,
  email: true,
  passwordHash: true,
  firstName: true,
  lastName: true,
  status: true,
  role: {
    select: {
      slug: true,
      permissions: {
        select: { permission: { select: { slug: true } } },
      },
    },
  },
} as const;

type UserWithRole = {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  role: {
    slug: string;
    permissions: { permission: { slug: string } }[];
  };
};

@Injectable()
export class AuthService {
  private readonly bcryptRounds = 12;
  private readonly refreshTokenDays = 7;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const participantRole = await this.prisma.role.findUnique({
      where: { slug: UserRole.PARTICIPANT },
    });
    if (!participantRole) {
      throw new ConflictException('Default role not configured. Run database seed.');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleId: participantRole.id,
      },
      select: USER_WITH_ROLE_SELECT,
    });

    const tokens = await this.issueTokens(user);
    return { user: this.toAuthUser(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: USER_WITH_ROLE_SELECT,
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens(user);
    return { user: this.toAuthUser(user), ...tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: { select: USER_WITH_ROLE_SELECT },
      },
    });

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt < new Date() ||
      stored.user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user);
  }

  async logout(refreshToken: string, userId: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.userId !== userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(user: UserWithRole): Promise<AuthTokens> {
    const permissions = this.extractPermissions(user);
    const role = user.role.slug as UserRole;

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRY', '24h'),
    });

    const refreshToken = generateRefreshToken();
    const refreshDays = this.parseRefreshExpiryDays();

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(refreshDays),
      },
    });

    return { accessToken, refreshToken };
  }

  private extractPermissions(user: UserWithRole): string[] {
    return user.role.permissions.map((rp) => rp.permission.slug);
  }

  private toAuthUser(user: UserWithRole) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.slug as UserRole,
      permissions: this.extractPermissions(user),
    };
  }

  private parseRefreshExpiryDays(): number {
    const expiry = this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d');
    const match = expiry.match(/^(\d+)d$/);
    return match ? parseInt(match[1], 10) : this.refreshTokenDays;
  }
}
