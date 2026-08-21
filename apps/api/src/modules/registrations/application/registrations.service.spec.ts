import { BadRequestException, ConflictException } from '@nestjs/common';
import { TournamentStatus } from '@prisma/client';

import { RegistrationsService } from './registrations.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.module';

describe('RegistrationsService', () => {
  let service: RegistrationsService;
  let prisma: {
    tournamentRegistration: {
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      aggregate: jest.Mock;
    };
    tournament: {
      findFirst: jest.Mock;
    };
    participant: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    registrationPigeon: {
      updateMany: jest.Mock;
    };
    registrationPayment: {
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const tournament = {
    id: 'tournament-1',
    title: 'Spring Classic',
    city: 'Lahore',
    entryFee: 500,
    totalPigeonsAllowed: 10,
    status: TournamentStatus.ACTIVE,
    deletedAt: null,
  };

  const participant = {
    id: 'participant-1',
    name: 'Ahmed Khan',
    deletedAt: null,
  };

  const registration = {
    id: 'registration-1',
    tournamentId: 'tournament-1',
    participantId: 'participant-1',
    pigeonCount: 3,
    entryFeePerPigeon: 500,
    totalFee: 1500,
    paidAmount: 0,
    paymentStatus: 'PENDING',
    receiptNumber: 'RCP-2026-000001',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    tournament: {
      id: 'tournament-1',
      title: 'Spring Classic',
      city: 'Lahore',
      entryFee: 500,
    },
    participant: {
      id: 'participant-1',
      tournamentId: 'tournament-1',
      name: 'Ahmed Khan',
      fatherName: 'Muhammad Khan',
      phone: '+923001234567',
      city: 'Lahore',
      address: null,
      loftName: 'Sky Loft',
      profileImage: null,
    },
  };

  beforeEach(() => {
    prisma = {
      tournamentRegistration: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
      },
      tournament: {
        findFirst: jest.fn(),
      },
      participant: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      registrationPigeon: {
        updateMany: jest.fn(),
      },
      registrationPayment: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (callback) => callback(prisma)),
    };

    service = new RegistrationsService(prisma as unknown as PrismaService);
  });

  describe('fee calculation', () => {
    it('calculates total fee from tournament entry fee and pigeon count', async () => {
      prisma.tournament.findFirst.mockResolvedValue(tournament);

      const result = await service.previewFee('tournament-1', 4);

      expect(result.entryFeePerPigeon).toBe(500);
      expect(result.totalFee).toBe(2000);
      expect(result.remainingPigeonSlots).toBe(6);
    });
  });

  describe('pigeon limit validation', () => {
    it('rejects when requested pigeons exceed the per-participant quota', async () => {
      prisma.tournament.findFirst.mockResolvedValue(tournament);

      await expect(service.assertPigeonLimit('tournament-1', 11)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows a count within the per-participant quota', async () => {
      prisma.tournament.findFirst.mockResolvedValue(tournament);

      await expect(service.assertPigeonLimit('tournament-1', 10)).resolves.toBeUndefined();
    });
  });

  describe('duplicate registration prevention', () => {
    it('rejects duplicate phone registration in the same tournament', async () => {
      prisma.tournament.findFirst.mockResolvedValue(tournament);
      prisma.participant.findFirst.mockResolvedValue(participant);
      prisma.tournamentRegistration.aggregate.mockResolvedValue({ _sum: { pigeonCount: 0 } });
      prisma.tournamentRegistration.count.mockResolvedValue(0);

      await expect(
        service.create({
          tournamentId: 'tournament-1',
          participant: {
            name: 'Ahmed Khan',
            fatherName: 'Muhammad Khan',
            phone: '+923001234567',
            city: 'Lahore',
            loftName: 'Sky Loft',
          },
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('create registration', () => {
    it('creates registration with quota pigeons, calculated fee and receipt number', async () => {
      prisma.tournament.findFirst.mockResolvedValue(tournament);
      prisma.participant.findFirst.mockResolvedValue(null);
      prisma.participant.create.mockResolvedValue({
        id: 'participant-1',
        tournamentId: 'tournament-1',
        name: 'Ahmed Khan',
      });
      prisma.tournamentRegistration.count.mockResolvedValue(0);
      prisma.tournamentRegistration.create.mockResolvedValue({
        ...registration,
        pigeonCount: 10,
        totalFee: 5000,
        paidAmount: 5000,
        paymentStatus: 'PAID',
      });

      const result = await service.create({
        tournamentId: 'tournament-1',
        participant: {
          name: 'Ahmed Khan',
          fatherName: 'Muhammad Khan',
          phone: '+923001234567',
          city: 'Lahore',
          loftName: 'Sky Loft',
        },
      });

      expect(result.receiptNumber).toBe('RCP-2026-000001');
      expect(prisma.tournamentRegistration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pigeonCount: 10,
            totalFee: 5000,
            paidAmount: 5000,
            paymentStatus: 'PAID',
            payments: {
              create: {
                amount: 5000,
                notes: 'Paid at registration',
              },
            },
            pigeons: {
              create: expect.arrayContaining([
                expect.objectContaining({ pigeonNumber: 1 }),
                expect.objectContaining({ pigeonNumber: 10 }),
              ]),
            },
          }),
        }),
      );
    });
  });
});
