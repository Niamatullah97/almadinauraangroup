import {
  calculateDailyResults,
  calculateTotalResults,
  toDailyPigeonInputs,
} from '@kabootar/shared';
import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.module';
import { ResultsService } from './results.service';

const tournamentRecord = {
  id: 'tournament-1',
  startDate: new Date('2026-04-01'),
  endDate: new Date('2026-04-03'),
  startTime: '06:00',
  endTime: '18:00',
  totalPigeonsAllowed: 1,
  status: 'ACTIVE',
};

describe('ResultsService', () => {
  let service: ResultsService;
  let prisma: {
    tournament: { findFirst: jest.Mock };
    raceDay: { findMany: jest.Mock };
    registrationPigeon: { findMany: jest.Mock };
    raceDayWinner: { deleteMany: jest.Mock; upsert: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      tournament: { findFirst: jest.fn() },
      raceDay: { findMany: jest.fn() },
      registrationPigeon: { findMany: jest.fn() },
      raceDayWinner: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }), upsert: jest.fn() },
    };

    service = new ResultsService(prisma as unknown as PrismaService);
  });

  it('calculates daily results from persisted data', async () => {
    prisma.tournament.findFirst.mockResolvedValue(tournamentRecord);
    prisma.raceDay.findMany.mockResolvedValue([
      {
        id: 'race-day-1',
        raceDate: new Date('2026-04-01'),
        releaseTime: '06:30',
        endTime: '18:00',
      },
    ]);
    prisma.registrationPigeon.findMany.mockResolvedValue([
      {
        id: 'pigeon-1',
        participantId: 'participant-a',
        pigeonNumber: 1,
        ringNumber: 'PK-1',
        isDoubleStamp: false,
        participant: {
          id: 'participant-a',
          name: 'Ahmed',
          loftName: 'Sky Loft',
          profileImage: null,
        },
        landingTimes: [
          {
            raceDayId: 'race-day-1',
            landingTime: new Date(2026, 3, 1, 8, 0, 0),
          },
        ],
      },
      {
        id: 'pigeon-2',
        participantId: 'participant-b',
        pigeonNumber: 1,
        ringNumber: 'PK-2',
        isDoubleStamp: false,
        participant: {
          id: 'participant-b',
          name: 'Bilal',
          loftName: 'Star Loft',
          profileImage: null,
        },
        landingTimes: [],
      },
    ]);

    const result = await service.getDailyResults('tournament-1', 'race-day-1');

    expect(result.summary.landedPigeons).toBe(1);
    expect(result.summary.remainingPigeons).toBe(1);
    expect(result.rankings[0].participantId).toBe('participant-a');
    expect(result.rankings[0].pigeons[0].landingClockTime).toBe('08:00:00');
  });

  it('recalculates total results after edits', async () => {
    prisma.tournament.findFirst.mockResolvedValue(tournamentRecord);
    prisma.raceDay.findMany.mockResolvedValue([
      {
        id: 'race-day-1',
        raceDate: new Date('2026-04-01'),
        releaseTime: '06:30',
        endTime: '18:00',
      },
    ]);
    prisma.registrationPigeon.findMany.mockResolvedValue([
      {
        id: 'pigeon-1',
        participantId: 'participant-a',
        pigeonNumber: 1,
        ringNumber: 'PK-1',
        isDoubleStamp: false,
        participant: {
          id: 'participant-a',
          name: 'Ahmed',
          loftName: 'Sky Loft',
          profileImage: null,
        },
        landingTimes: [
          {
            raceDayId: 'race-day-1',
            landingTime: new Date(2026, 3, 1, 7, 45, 0),
          },
        ],
      },
      {
        id: 'pigeon-2',
        participantId: 'participant-b',
        pigeonNumber: 1,
        ringNumber: 'PK-2',
        isDoubleStamp: false,
        participant: {
          id: 'participant-b',
          name: 'Bilal',
          loftName: 'Star Loft',
          profileImage: null,
        },
        landingTimes: [
          {
            raceDayId: 'race-day-1',
            landingTime: new Date(2026, 3, 1, 8, 0, 0),
          },
        ],
      },
    ]);

    const result = await service.getTotalResults('tournament-1');

    expect(result.rankings[0].participantId).toBe('participant-a');
    expect(result.firstWinner?.participantId).toBe('participant-b');
  });

  it('builds a complete export bundle with daily, total, and double stamp tables', async () => {
    prisma.tournament.findFirst.mockResolvedValue(tournamentRecord);
    prisma.raceDay.findMany.mockResolvedValue([
      {
        id: 'race-day-1',
        raceDate: new Date('2026-04-01'),
        releaseTime: '06:30',
        endTime: '18:00',
      },
    ]);
    prisma.registrationPigeon.findMany.mockResolvedValue([
      {
        id: 'pigeon-1',
        participantId: 'participant-a',
        pigeonNumber: 1,
        ringNumber: 'PK-1',
        isDoubleStamp: true,
        participant: {
          id: 'participant-a',
          name: 'Ahmed',
          loftName: 'Sky Loft',
          profileImage: null,
        },
        landingTimes: [
          {
            raceDayId: 'race-day-1',
            landingTime: new Date(2026, 3, 1, 8, 0, 0),
          },
        ],
      },
    ]);

    const bundle = await service.getCompleteResults('tournament-1');

    expect(bundle.raceDays).toHaveLength(1);
    expect(bundle.raceDays[0].daily.raceDate).toBe('2026-04-01');
    expect(bundle.raceDays[0].doubleStamp.rankings).toHaveLength(1);
    expect(bundle.total.summary.totalPigeons).toBe(1);
    expect(bundle.doubleStampTotal.rankings[0].participantId).toBe('participant-a');
  });

  it('persists calculated race day winners', async () => {
    prisma.tournament.findFirst.mockResolvedValue(tournamentRecord);
    prisma.raceDay.findMany.mockResolvedValue([
      {
        id: 'race-day-1',
        raceDate: new Date('2026-04-01'),
        releaseTime: '06:30',
        endTime: '18:00',
        status: 'COMPLETED',
      },
    ]);
    prisma.registrationPigeon.findMany.mockResolvedValue([
      {
        id: 'pigeon-1',
        participantId: 'participant-a',
        pigeonNumber: 1,
        ringNumber: 'PK-1',
        isDoubleStamp: false,
        participant: {
          id: 'participant-a',
          name: 'Ahmed',
          loftName: 'Sky Loft',
          profileImage: null,
        },
        landingTimes: [
          {
            raceDayId: 'race-day-1',
            landingTime: new Date(2026, 3, 1, 8, 0, 0),
          },
        ],
      },
    ]);
    prisma.raceDayWinner.upsert.mockResolvedValue({});

    const persisted = await service.persistRaceDayWinners('tournament-1', 'race-day-1');

    expect(persisted.firstWinner?.participantId).toBe('participant-a');
    expect(persisted.bravePigeon?.registrationPigeonId).toBe('pigeon-1');
    expect(persisted.bravePigeon?.category).toBe('brave');
    expect(prisma.raceDayWinner.upsert).toHaveBeenCalled();
  });

  it('throws when tournament is missing', async () => {
    prisma.tournament.findFirst.mockResolvedValue(null);

    await expect(service.getTotalResults('missing')).rejects.toThrow(NotFoundException);
  });
});

describe('results pure integration', () => {
  it('matches service mapping with pure daily calculator', () => {
    const raceDay = {
      raceDayId: 'race-day-1',
      raceDate: '2026-04-01',
      releaseTime: '06:30',
      endTime: '18:00',
    };

    const input = {
      tournamentId: 'tournament-1',
      startDate: '2026-04-01',
      endDate: '2026-04-03',
      startTime: '06:00',
      endTime: '18:00',
      totalPigeonsAllowed: 1,
      raceDays: [raceDay],
      pigeons: [
        {
          registrationPigeonId: 'pigeon-1',
          participantId: 'participant-a',
          participantName: 'Ahmed',
          loftName: 'Sky Loft',
          pigeonNumber: 1,
          ringNumber: 'PK-1',
          isDoubleStamp: false,
          landings: [{ raceDayId: 'race-day-1', landingTime: new Date(2026, 3, 1, 8, 0, 0) }],
        },
      ],
    };

    const window = { startTime: input.startTime, endTime: input.endTime };
    const daily = calculateDailyResults(raceDay, toDailyPigeonInputs(input, 'race-day-1'), window);
    const total = calculateTotalResults(input);

    expect(daily.rankings[0].rank).toBe(1);
    expect(total.summary.totalPigeons).toBe(1);
  });
});
