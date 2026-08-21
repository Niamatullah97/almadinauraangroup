import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthTokenType, isOrganizerToken, JwtPayload, UserRole } from '@kabootar/shared';

import { PrismaService } from '../../../infrastructure/prisma/prisma.module';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (isOrganizerToken(payload)) {
      const link = await this.prisma.tournamentAccessLink.findFirst({
        where: { id: payload.sub, revokedAt: null },
      });

      if (!link || link.expiresAt.getTime() <= Date.now()) {
        throw new UnauthorizedException('Organizer access link has expired');
      }

      return {
        sub: payload.sub,
        email: payload.email ?? '',
        role: UserRole.ORGANIZER,
        permissions: payload.permissions ?? [],
        tokenType: AuthTokenType.ORGANIZER,
        tournamentId: link.tournamentId,
      };
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions ?? [],
      tokenType: AuthTokenType.USER,
    };
  }
}
