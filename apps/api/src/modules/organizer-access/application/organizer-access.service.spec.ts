import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AccessLinkExpiryPreset } from '@kabootar/shared';

import { OrganizerAccessService } from './organizer-access.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.module';
import { TournamentsService } from '../../tournaments/application/tournaments.service';

describe('OrganizerAccessService', () => {
  let service: OrganizerAccessService;
  let prisma: {
    tournament: { findFirst: jest.Mock };
    tournamentAccessLink: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let jwtService: { sign: jest.Mock };
  let tournamentsService: { findOne: jest.Mock };

  const now = new Date('2026-08-15T10:00:00.000Z');
  const future = new Date('2026-08-22T10:00:00.000Z');

  const linkRecord = {
    id: 'link-1',
    tournamentId: 'tournament-1',
    token: 'a'.repeat(64),
    secretKeyHash: 'hash',
    expiryPreset: AccessLinkExpiryPreset.DAYS_7,
    expiresAt: future,
    revokedAt: null,
    lastUsedAt: null,
    createdById: 'admin-1',
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);

    prisma = {
      tournament: { findFirst: jest.fn().mockResolvedValue({ id: 'tournament-1' }) },
      tournamentAccessLink: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    jwtService = { sign: jest.fn().mockReturnValue('organizer-jwt') };
    tournamentsService = {
      findOne: jest.fn().mockResolvedValue({ id: 'tournament-1', title: 'Classic' }),
    };

    service = new OrganizerAccessService(
      prisma as unknown as PrismaService,
      jwtService as never,
      { get: jest.fn().mockReturnValue('http://localhost:4200') } as never,
      tournamentsService as unknown as TournamentsService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates an access link with a secret key shown once', async () => {
    prisma.tournamentAccessLink.create.mockResolvedValue(linkRecord);

    const result = await service.create('tournament-1', 'admin-1', {
      expiryPreset: AccessLinkExpiryPreset.DAYS_7,
    });

    expect(result.secretKey).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(result.accessUrl).toBe(`http://localhost:4200/organizer/${linkRecord.token}`);
    expect(result.isActive).toBe(true);
    expect(prisma.tournamentAccessLink.create).toHaveBeenCalled();
  });

  it('rejects a custom expiration in the past', async () => {
    await expect(
      service.create('tournament-1', 'admin-1', {
        expiryPreset: AccessLinkExpiryPreset.CUSTOM,
        expiresAt: '2026-08-14T10:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('unlocks a valid link and issues an organizer token', async () => {
    prisma.tournamentAccessLink.create.mockResolvedValue(linkRecord);
    const created = await service.create('tournament-1', 'admin-1', {
      expiryPreset: AccessLinkExpiryPreset.DAYS_7,
    });
    const storedHash = prisma.tournamentAccessLink.create.mock.calls[0][0].data.secretKeyHash;

    prisma.tournamentAccessLink.findUnique.mockResolvedValue({
      ...linkRecord,
      secretKeyHash: storedHash,
    });
    prisma.tournamentAccessLink.update.mockResolvedValue(linkRecord);

    const result = await service.unlock(linkRecord.token, created.secretKey);

    expect(result.accessToken).toBe('organizer-jwt');
    expect(result.tournament.id).toBe('tournament-1');
    expect(jwtService.sign).toHaveBeenCalled();
  });

  it('rejects an expired link on unlock', async () => {
    prisma.tournamentAccessLink.findUnique.mockResolvedValue({
      ...linkRecord,
      expiresAt: new Date('2026-08-15T09:00:00.000Z'),
    });

    await expect(service.unlock(linkRecord.token, 'AAAA-BBBB-CCCC')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('revokes an access link', async () => {
    prisma.tournamentAccessLink.findFirst.mockResolvedValue(linkRecord);
    prisma.tournamentAccessLink.update.mockResolvedValue({
      ...linkRecord,
      revokedAt: now,
    });

    const result = await service.revoke('tournament-1', 'link-1');
    expect(result.isRevoked).toBe(true);
    expect(result.isActive).toBe(false);
  });

  it('throws when tournament is missing', async () => {
    prisma.tournament.findFirst.mockResolvedValue(null);
    await expect(service.list('missing')).rejects.toThrow(NotFoundException);
  });
});
