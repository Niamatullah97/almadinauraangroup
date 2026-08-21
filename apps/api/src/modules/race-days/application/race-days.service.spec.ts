import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, RaceDayStatus, TournamentStatus } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.module';
import { RaceDaysService } from './race-days.service';

describe('RaceDaysService', () => {
  let service: RaceDaysService;
  let resultsService: { persistRaceDayWinners: jest.Mock };
  let prisma: {
    tournament: { findFirst: jest.Mock };
    raceDay: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const tournament = {
    id: 'tournament-1',
    status: TournamentStatus.ACTIVE,
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-04-05'),
    deletedAt: null,
  };

  const raceDay = {
    id: 'race-day-1',
    tournamentId: 'tournament-1',
    raceDate: new Date('2026-04-02'),
    releaseTime: '06:30',
    endTime: '18:00',
    releaseLocation: 'Central Loft',
    weatherNotes: null,
    status: RaceDayStatus.PENDING,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
  };

  beforeEach(() => {
    prisma = {
      tournament: { findFirst: jest.fn() },
      raceDay: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    resultsService = { persistRaceDayWinners: jest.fn().mockResolvedValue({}) };

    service = new RaceDaysService(prisma as unknown as PrismaService, resultsService as never);
  });

  describe('findAllByTournament', () => {
    it('returns race days ordered by date', async () => {
      prisma.tournament.findFirst.mockResolvedValue(tournament);
      prisma.raceDay.findMany.mockResolvedValue([raceDay]);

      const result = await service.findAllByTournament('tournament-1');

      expect(result).toHaveLength(1);
      expect(result[0].raceDate).toBe('2026-04-02');
    });
  });

  describe('create', () => {
    it('creates a race day for an active tournament', async () => {
      prisma.tournament.findFirst.mockResolvedValue(tournament);
      prisma.raceDay.findFirst.mockResolvedValue(null);
      prisma.raceDay.create.mockResolvedValue(raceDay);

      const result = await service.create('tournament-1', {
        raceDate: '2026-04-02',
        releaseTime: '06:30',
        endTime: '18:00',
        releaseLocation: 'Central Loft',
      });

      expect(result.releaseLocation).toBe('Central Loft');
    });

    it('rejects duplicate race dates', async () => {
      prisma.tournament.findFirst.mockResolvedValue(tournament);
      prisma.raceDay.findFirst.mockResolvedValue(raceDay);

      await expect(
        service.create('tournament-1', {
          raceDate: '2026-04-02',
          releaseTime: '06:30',
          endTime: '18:00',
          releaseLocation: 'Central Loft',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects race dates outside tournament range', async () => {
      prisma.tournament.findFirst.mockResolvedValue(tournament);

      await expect(
        service.create('tournament-1', {
          raceDate: '2026-05-01',
          releaseTime: '06:30',
          endTime: '18:00',
          releaseLocation: 'Central Loft',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an end time that is not after the release time', async () => {
      prisma.tournament.findFirst.mockResolvedValue(tournament);

      await expect(
        service.create('tournament-1', {
          raceDate: '2026-04-02',
          releaseTime: '18:00',
          endTime: '18:00',
          releaseLocation: 'Central Loft',
        }),
      ).rejects.toThrow('Race day end time must be after its release time');
    });

    it('rejects mutations for completed tournaments', async () => {
      prisma.tournament.findFirst.mockResolvedValue({
        ...tournament,
        status: TournamentStatus.COMPLETED,
      });

      await expect(
        service.create('tournament-1', {
          raceDate: '2026-04-02',
          releaseTime: '06:30',
          endTime: '18:00',
          releaseLocation: 'Central Loft',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('throws when race day is missing', async () => {
      prisma.raceDay.findFirst.mockResolvedValue(null);

      await expect(service.findOne('tournament-1', 'missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('persists winners when a race day is marked completed', async () => {
      prisma.tournament.findFirst.mockResolvedValue(tournament);
      prisma.raceDay.findFirst.mockResolvedValue(raceDay);
      prisma.raceDay.update.mockResolvedValue({
        ...raceDay,
        status: RaceDayStatus.COMPLETED,
      });

      await service.update('tournament-1', 'race-day-1', { status: RaceDayStatus.COMPLETED });

      expect(resultsService.persistRaceDayWinners).toHaveBeenCalledWith(
        'tournament-1',
        'race-day-1',
      );
    });

    it('maps prisma unique violations to conflict errors', async () => {
      prisma.tournament.findFirst.mockResolvedValue(tournament);
      prisma.raceDay.findFirst.mockResolvedValue(raceDay);
      prisma.raceDay.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '6.0.0',
        }),
      );

      await expect(
        service.update('tournament-1', 'race-day-1', { releaseLocation: 'New Loft' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
