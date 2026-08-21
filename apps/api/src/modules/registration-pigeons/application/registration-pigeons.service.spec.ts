import { BadRequestException, ConflictException } from '@nestjs/common';
import { PigeonSex, TournamentStatus } from '@prisma/client';
import { PigeonSex as SharedPigeonSex } from '@kabootar/shared';

import { RegistrationPigeonsService } from './registration-pigeons.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.module';

describe('RegistrationPigeonsService', () => {
  let service: RegistrationPigeonsService;
  let prisma: {
    tournamentRegistration: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      aggregate: jest.Mock;
      update: jest.Mock;
    };
    tournament: { findFirst: jest.Mock };
    registrationPigeon: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const registration = {
    id: 'registration-1',
    tournamentId: 'tournament-1',
    participantId: 'participant-1',
    pigeonCount: 0,
    entryFeePerPigeon: 500,
    paidAmount: 0,
    deletedAt: null,
    tournament: {
      id: 'tournament-1',
      status: TournamentStatus.ACTIVE,
      doubleStampEnabled: false,
      totalPigeonsAllowed: 10,
    },
  };

  const pigeon = {
    id: 'pigeon-1',
    registrationId: 'registration-1',
    tournamentId: 'tournament-1',
    participantId: 'participant-1',
    ringNumber: 'PK-001',
    pigeonNumber: 1,
    color: 'Blue Bar',
    gender: PigeonSex.COCK,
    isDoubleStamp: false,
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
  };

  beforeEach(() => {
    prisma = {
      tournamentRegistration: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        aggregate: jest.fn(),
        update: jest.fn(),
      },
      tournament: { findFirst: jest.fn() },
      registrationPigeon: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (callback) => callback(prisma)),
    };

    service = new RegistrationPigeonsService(prisma as unknown as PrismaService);
  });

  it('lists pigeons with remaining participant quota', async () => {
    prisma.tournamentRegistration.findFirst.mockResolvedValue(registration);
    prisma.registrationPigeon.findMany.mockResolvedValue([pigeon]);

    const result = await service.findAllByRegistration('registration-1');

    expect(result.registeredCount).toBe(1);
    expect(result.remainingCount).toBe(9);
  });

  it('rejects manual add when the participant quota is reached', async () => {
    prisma.tournamentRegistration.findFirst.mockResolvedValue(registration);
    prisma.registrationPigeon.count.mockResolvedValue(10);

    await expect(
      service.create('registration-1', {
        ringNumber: 'PK-004',
        color: 'Red',
        gender: SharedPigeonSex.HEN,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates a pigeon with auto-assigned number', async () => {
    prisma.tournamentRegistration.findFirst.mockResolvedValue(registration);
    prisma.registrationPigeon.count.mockResolvedValue(1);
    prisma.registrationPigeon.findMany.mockResolvedValue([{ pigeonNumber: 1 }]);
    prisma.registrationPigeon.findFirst.mockResolvedValue(null);
    prisma.registrationPigeon.create.mockResolvedValue({ ...pigeon, pigeonNumber: 2 });
    prisma.tournamentRegistration.update.mockResolvedValue(registration);

    const result = await service.create('registration-1', {
      ringNumber: 'PK-002',
      color: 'Red',
      gender: SharedPigeonSex.HEN,
    });

    expect(result.pigeonNumber).toBe(2);
  });

  it('bulk generates remaining participant pigeons', async () => {
    prisma.tournamentRegistration.findFirst.mockResolvedValue({
      ...registration,
      tournament: { ...registration.tournament, totalPigeonsAllowed: 3 },
    });
    prisma.registrationPigeon.count.mockResolvedValue(1);
    prisma.registrationPigeon.findMany.mockResolvedValue([{ pigeonNumber: 1 }]);
    prisma.registrationPigeon.create.mockImplementation(async ({ data }) => ({
      ...pigeon,
      ...data,
      id: `pigeon-${data.pigeonNumber}`,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt: null,
    }));
    prisma.tournamentRegistration.update.mockResolvedValue(registration);

    const result = await service.bulkGenerate('registration-1', { color: 'Blue' });

    expect(result.created).toHaveLength(2);
    expect(result.remainingCount).toBe(0);
  });

  it('toggles double stamp flag', async () => {
    prisma.tournamentRegistration.findFirst.mockResolvedValue({
      ...registration,
      tournament: { ...registration.tournament, doubleStampEnabled: true },
    });
    prisma.registrationPigeon.findFirst.mockResolvedValue(pigeon);
    prisma.registrationPigeon.update.mockResolvedValue({ ...pigeon, isDoubleStamp: true });

    const result = await service.toggleDoubleStamp('registration-1', 'pigeon-1');

    expect(result.isDoubleStamp).toBe(true);
  });

  it('rejects double stamp when the tournament does not enable it', async () => {
    prisma.tournamentRegistration.findFirst.mockResolvedValue(registration);
    prisma.registrationPigeon.findFirst.mockResolvedValue(pigeon);

    await expect(service.toggleDoubleStamp('registration-1', 'pigeon-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects duplicate ring numbers in tournament', async () => {
    prisma.tournamentRegistration.findFirst.mockResolvedValue(registration);
    prisma.registrationPigeon.count.mockResolvedValue(0);
    prisma.registrationPigeon.findMany.mockResolvedValue([]);
    prisma.registrationPigeon.findFirst.mockResolvedValue(pigeon);

    await expect(
      service.create('registration-1', {
        ringNumber: 'PK-001',
        color: 'Blue',
        gender: SharedPigeonSex.COCK,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('backfills missing quota pigeon slots', async () => {
    prisma.tournament.findFirst.mockResolvedValue({ totalPigeonsAllowed: 2 });
    prisma.tournamentRegistration.findMany.mockResolvedValue([
      {
        ...registration,
        pigeons: [{ id: 'pigeon-1', pigeonNumber: 1, deletedAt: null }],
      },
    ]);
    prisma.registrationPigeon.create.mockResolvedValue({ ...pigeon, pigeonNumber: 2 });
    prisma.registrationPigeon.count.mockResolvedValue(2);
    prisma.tournamentRegistration.update.mockResolvedValue(registration);

    await service.ensureQuotaSlots('tournament-1');

    expect(prisma.registrationPigeon.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ pigeonNumber: 2 }),
      }),
    );
  });
});
