import { TournamentStatus } from '@prisma/client';

import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.module';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: {
    tournament: { count: jest.Mock };
    participant: { count: jest.Mock };
    registrationPigeon: { count: jest.Mock };
    tournamentRegistration: { aggregate: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      tournament: { count: jest.fn() },
      participant: { count: jest.fn() },
      registrationPigeon: { count: jest.fn() },
      tournamentRegistration: { aggregate: jest.fn() },
    };

    service = new DashboardService(prisma as unknown as PrismaService);
  });

  it('returns live tournament, participant, pigeon and fee totals', async () => {
    prisma.tournament.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);
    prisma.participant.count.mockResolvedValue(1);
    prisma.registrationPigeon.count.mockResolvedValue(5);
    prisma.tournamentRegistration.aggregate.mockResolvedValue({
      _sum: { totalFee: 2500, paidAmount: 2500 },
    });

    await expect(service.getStats()).resolves.toEqual({
      totalTournaments: 1,
      activeTournaments: 1,
      totalParticipants: 1,
      totalPigeons: 5,
      totalEntryFees: 2500,
      totalPrizePool: 2500,
    });

    expect(prisma.tournament.count).toHaveBeenNthCalledWith(1, {
      where: { deletedAt: null },
    });
    expect(prisma.tournament.count).toHaveBeenNthCalledWith(2, {
      where: { deletedAt: null, status: TournamentStatus.ACTIVE },
    });
    expect(prisma.participant.count).toHaveBeenCalledWith({
      where: { deletedAt: null, tournament: { deletedAt: null } },
    });
    expect(prisma.registrationPigeon.count).toHaveBeenCalledWith({
      where: { deletedAt: null, tournament: { deletedAt: null } },
    });
    expect(prisma.tournamentRegistration.aggregate).toHaveBeenCalledWith({
      where: { deletedAt: null, tournament: { deletedAt: null } },
      _sum: { totalFee: true, paidAmount: true },
    });
  });

  it('treats missing fee totals as zero', async () => {
    prisma.tournament.count.mockResolvedValue(0);
    prisma.participant.count.mockResolvedValue(0);
    prisma.registrationPigeon.count.mockResolvedValue(0);
    prisma.tournamentRegistration.aggregate.mockResolvedValue({
      _sum: { totalFee: null, paidAmount: null },
    });

    await expect(service.getStats()).resolves.toEqual({
      totalTournaments: 0,
      activeTournaments: 0,
      totalParticipants: 0,
      totalPigeons: 0,
      totalEntryFees: 0,
      totalPrizePool: 0,
    });
  });
});
