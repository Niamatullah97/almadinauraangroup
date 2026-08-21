import { AuthTokenType, UserRole } from '@kabootar/shared';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { RaceDayStatus } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.module';
import { LandingTimesService } from './landing-times.service';

describe('LandingTimesService', () => {
  let service: LandingTimesService;
  let resultsService: { persistRaceDayWinners: jest.Mock };
  let registrationPigeonsService: { ensureQuotaSlots: jest.Mock };
  let prisma: {
    raceDay: { findFirst: jest.Mock };
    tournament: { findFirst: jest.Mock };
    tournamentRegistration: { findMany: jest.Mock };
    registrationPigeon: { findMany: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    pigeonLandingTime: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const raceDay = {
    id: 'race-day-1',
    tournamentId: 'tournament-1',
    raceDate: new Date('2026-04-01'),
    releaseTime: '06:30',
    endTime: '18:00',
    status: RaceDayStatus.LIVE,
    deletedAt: null,
  };

  const landingTime = {
    id: 'landing-1',
    tournamentId: 'tournament-1',
    raceDayId: 'race-day-1',
    participantId: 'participant-1',
    registrationPigeonId: 'pigeon-1',
    landingTime: new Date(2026, 3, 1, 14, 35, 22),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 3, 1, 12, 0, 0));
    prisma = {
      raceDay: { findFirst: jest.fn() },
      tournament: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ doubleStampEnabled: false, totalPigeonsAllowed: 1 }),
      },
      tournamentRegistration: { findMany: jest.fn() },
      registrationPigeon: { findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      pigeonLandingTime: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    resultsService = { persistRaceDayWinners: jest.fn().mockResolvedValue({}) };
    registrationPigeonsService = { ensureQuotaSlots: jest.fn().mockResolvedValue(undefined) };

    service = new LandingTimesService(
      prisma as unknown as PrismaService,
      resultsService as never,
      registrationPigeonsService as never,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('builds entry sheet grouped by participant', async () => {
    prisma.raceDay.findFirst.mockResolvedValue(raceDay);
    prisma.tournamentRegistration.findMany.mockResolvedValue([
      {
        participantId: 'participant-1',
        participant: {
          id: 'participant-1',
          name: 'Ahmed Khan',
          loftName: 'Sky Loft',
          profileImage: null,
        },
        pigeons: [
          {
            id: 'pigeon-1',
            pigeonNumber: 1,
            ringNumber: 'PK-001',
            isDoubleStamp: true,
            landingTimes: [landingTime],
          },
        ],
      },
    ]);

    const result = await service.getEntrySheet('tournament-1', 'race-day-1');

    expect(registrationPigeonsService.ensureQuotaSlots).toHaveBeenCalledWith('tournament-1');
    expect(result.pigeonCount).toBe(1);
    expect(result.participants).toHaveLength(1);
    expect(result.participants[0].profileImage).toBeNull();
    expect(result.participants[0].pigeons[0].landingTime).toBe('14:35:22');
    expect(result.participants[0].pigeons[0].isDoubleStamp).toBe(true);
    expect(result.doubleStampEnabled).toBe(false);
  });

  it('rejects landing time entry for pending race day', async () => {
    prisma.raceDay.findFirst.mockResolvedValue({ ...raceDay, status: RaceDayStatus.PENDING });
    prisma.registrationPigeon.findFirst.mockResolvedValue({ id: 'pigeon-1' });
    prisma.pigeonLandingTime.findFirst.mockResolvedValue(null);

    await expect(
      service.create('tournament-1', 'race-day-1', {
        participantId: 'participant-1',
        registrationPigeonId: 'pigeon-1',
        landingTime: '14:35:22',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a landing time before the race-day start', async () => {
    prisma.raceDay.findFirst.mockResolvedValue(raceDay);
    prisma.registrationPigeon.findFirst.mockResolvedValue({ id: 'pigeon-1' });
    prisma.pigeonLandingTime.findFirst.mockResolvedValue(null);

    await expect(
      service.create('tournament-1', 'race-day-1', {
        participantId: 'participant-1',
        registrationPigeonId: 'pigeon-1',
        landingTime: '06:29:59',
      }),
    ).rejects.toThrow('Landing time cannot be before the race day start time');
  });

  it('rejects a landing time after the race-day end', async () => {
    prisma.raceDay.findFirst.mockResolvedValue(raceDay);
    prisma.registrationPigeon.findFirst.mockResolvedValue({ id: 'pigeon-1' });
    prisma.pigeonLandingTime.findFirst.mockResolvedValue(null);

    await expect(
      service.create('tournament-1', 'race-day-1', {
        participantId: 'participant-1',
        registrationPigeonId: 'pigeon-1',
        landingTime: '18:00:01',
      }),
    ).rejects.toThrow('Landing time cannot be after the race day end time');
  });

  it('rejects edits after the race-day end', async () => {
    jest.setSystemTime(new Date(2026, 3, 1, 18, 0, 1));
    prisma.raceDay.findFirst.mockResolvedValue(raceDay);

    await expect(
      service.update('tournament-1', 'race-day-1', 'landing-1', {
        landingTime: '17:00:00',
      }),
    ).rejects.toThrow('Landing times cannot be edited after the race day ends');
  });

  it('rejects duplicate landing entry', async () => {
    prisma.raceDay.findFirst.mockResolvedValue(raceDay);
    prisma.registrationPigeon.findFirst.mockResolvedValue({ id: 'pigeon-1' });
    prisma.pigeonLandingTime.findFirst.mockResolvedValue(landingTime);

    await expect(
      service.create('tournament-1', 'race-day-1', {
        participantId: 'participant-1',
        registrationPigeonId: 'pigeon-1',
        landingTime: '14:35:22',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('bulk saves landing times with upsert', async () => {
    prisma.raceDay.findFirst.mockResolvedValue(raceDay);
    prisma.registrationPigeon.findFirst.mockResolvedValue({ id: 'pigeon-1' });
    prisma.pigeonLandingTime.findFirst.mockResolvedValue(null);
    prisma.pigeonLandingTime.create.mockResolvedValue(landingTime);

    const result = await service.bulkSave('tournament-1', 'race-day-1', {
      entries: [
        {
          participantId: 'participant-1',
          registrationPigeonId: 'pigeon-1',
          landingTime: '14:35:22',
        },
      ],
    });

    expect(result.saved).toHaveLength(1);
    expect(resultsService.persistRaceDayWinners).toHaveBeenCalledWith('tournament-1', 'race-day-1');
  });

  it('saves double stamp flag with landing times when tournament enables it', async () => {
    prisma.raceDay.findFirst.mockResolvedValue(raceDay);
    prisma.tournament.findFirst.mockResolvedValue({ doubleStampEnabled: true });
    prisma.registrationPigeon.findFirst.mockResolvedValue({ id: 'pigeon-1' });
    prisma.registrationPigeon.update.mockResolvedValue({ id: 'pigeon-1', isDoubleStamp: true });
    prisma.pigeonLandingTime.findFirst.mockResolvedValue(null);
    prisma.pigeonLandingTime.create.mockResolvedValue(landingTime);

    const result = await service.bulkSave('tournament-1', 'race-day-1', {
      entries: [
        {
          participantId: 'participant-1',
          registrationPigeonId: 'pigeon-1',
          landingTime: '14:35:22',
          isDoubleStamp: true,
        },
      ],
    });

    expect(prisma.registrationPigeon.update).toHaveBeenCalledWith({
      where: { id: 'pigeon-1' },
      data: { isDoubleStamp: true },
    });
    expect(result.saved).toHaveLength(1);
  });

  it('rejects duplicate pigeons in bulk payload', async () => {
    prisma.raceDay.findFirst.mockResolvedValue(raceDay);

    await expect(
      service.bulkSave('tournament-1', 'race-day-1', {
        entries: [
          {
            participantId: 'participant-1',
            registrationPigeonId: 'pigeon-1',
            landingTime: '14:35:22',
          },
          {
            participantId: 'participant-1',
            registrationPigeonId: 'pigeon-1',
            landingTime: '15:00:00',
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects organizer landing time entry when the race day is not live', async () => {
    prisma.raceDay.findFirst.mockResolvedValue({ ...raceDay, status: RaceDayStatus.COMPLETED });
    prisma.registrationPigeon.findFirst.mockResolvedValue({ id: 'pigeon-1' });

    await expect(
      service.create(
        'tournament-1',
        'race-day-1',
        {
          participantId: 'participant-1',
          registrationPigeonId: 'pigeon-1',
          landingTime: '14:35:22',
        },
        {
          sub: 'link-1',
          email: '',
          role: UserRole.ORGANIZER,
          permissions: [],
          tokenType: AuthTokenType.ORGANIZER,
          tournamentId: 'tournament-1',
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
