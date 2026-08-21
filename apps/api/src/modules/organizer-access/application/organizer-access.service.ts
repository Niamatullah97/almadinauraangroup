import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TournamentAccessLink } from '@prisma/client';
import {
  AccessLinkExpiryPreset,
  AuthTokenType,
  isAccessLinkExpired,
  JwtPayload,
  ORGANIZER_PERMISSIONS,
  resolveAccessLinkExpiry,
  UserRole,
} from '@kabootar/shared';

import { PrismaService } from '../../../infrastructure/prisma/prisma.module';
import { TournamentsService } from '../../tournaments/application/tournaments.service';
import {
  generateAccessLinkToken,
  generateAccessSecretKey,
  hashSecretKey,
  secretHashesMatch,
} from '../infrastructure/access-link.util';
import { CreateAccessLinkDto } from '../presentation/dto/create-access-link.dto';

@Injectable()
export class OrganizerAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tournamentsService: TournamentsService,
  ) {}

  async create(tournamentId: string, createdById: string, dto: CreateAccessLinkDto) {
    await this.assertTournamentExists(tournamentId);

    let expiresAt: Date;
    try {
      expiresAt = resolveAccessLinkExpiry(
        dto.expiryPreset,
        dto.expiryPreset === AccessLinkExpiryPreset.CUSTOM ? dto.expiresAt : undefined,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid expiration',
      );
    }

    if (expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Expiration must be in the future');
    }

    const token = generateAccessLinkToken();
    const secretKey = generateAccessSecretKey();

    const link = await this.prisma.tournamentAccessLink.create({
      data: {
        tournamentId,
        createdById,
        token,
        secretKeyHash: hashSecretKey(secretKey),
        expiryPreset: dto.expiryPreset,
        expiresAt,
      },
    });

    return {
      ...this.mapLink(link),
      secretKey,
    };
  }

  async list(tournamentId: string) {
    await this.assertTournamentExists(tournamentId);

    const items = await this.prisma.tournamentAccessLink.findMany({
      where: { tournamentId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: items.map((item) => this.mapLink(item)),
      total: items.length,
    };
  }

  async revoke(tournamentId: string, linkId: string) {
    const link = await this.prisma.tournamentAccessLink.findFirst({
      where: { id: linkId, tournamentId },
    });

    if (!link) {
      throw new NotFoundException('Access link not found');
    }

    if (link.revokedAt) {
      return this.mapLink(link);
    }

    const updated = await this.prisma.tournamentAccessLink.update({
      where: { id: link.id },
      data: { revokedAt: new Date() },
    });

    return this.mapLink(updated);
  }

  async unlock(token: string, secretKey: string) {
    const link = await this.prisma.tournamentAccessLink.findUnique({
      where: { token },
    });

    if (!link || link.revokedAt) {
      throw new UnauthorizedException('Invalid access link or secret key');
    }

    if (isAccessLinkExpired(link.expiresAt)) {
      throw new UnauthorizedException('This access link has expired');
    }

    if (!secretHashesMatch(hashSecretKey(secretKey), link.secretKeyHash)) {
      throw new UnauthorizedException('Invalid access link or secret key');
    }

    await this.assertTournamentExists(link.tournamentId);

    await this.prisma.tournamentAccessLink.update({
      where: { id: link.id },
      data: { lastUsedAt: new Date() },
    });

    const ttlSeconds = Math.max(
      60,
      Math.floor((link.expiresAt.getTime() - Date.now()) / 1000),
    );

    const payload: JwtPayload = {
      sub: link.id,
      email: '',
      role: UserRole.ORGANIZER,
      permissions: [...ORGANIZER_PERMISSIONS],
      tokenType: AuthTokenType.ORGANIZER,
      tournamentId: link.tournamentId,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: ttlSeconds });
    const tournament = await this.tournamentsService.findOne(link.tournamentId);

    return {
      accessToken,
      expiresAt: link.expiresAt.toISOString(),
      token: link.token,
      tournament,
    };
  }

  private async assertTournamentExists(tournamentId: string): Promise<void> {
    const tournament = await this.prisma.tournament.findFirst({
      where: { id: tournamentId, deletedAt: null },
      select: { id: true },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }
  }

  private mapLink(link: TournamentAccessLink) {
    const expired = isAccessLinkExpired(link.expiresAt);
    const revoked = Boolean(link.revokedAt);

    return {
      id: link.id,
      tournamentId: link.tournamentId,
      token: link.token,
      accessUrl: this.buildAccessUrl(link.token),
      expiryPreset: link.expiryPreset as AccessLinkExpiryPreset,
      expiresAt: link.expiresAt.toISOString(),
      revokedAt: link.revokedAt?.toISOString() ?? null,
      lastUsedAt: link.lastUsedAt?.toISOString() ?? null,
      createdAt: link.createdAt.toISOString(),
      isExpired: expired,
      isRevoked: revoked,
      isActive: !expired && !revoked,
    };
  }

  private buildAccessUrl(token: string): string {
    const origin = (
      this.configService.get<string>('ADMIN_APP_URL') ?? 'http://localhost:4200'
    ).replace(/\/$/, '');
    return `${origin}/organizer/${token}`;
  }
}
