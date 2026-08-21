import { Injectable } from '@nestjs/common';
import { TournamentStatus } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.module';

export interface DashboardStatsDto {
  totalTournaments: number;
  activeTournaments: number;
  totalParticipants: number;
  totalPigeons: number;
  totalEntryFees: number;
  totalPrizePool: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<DashboardStatsDto> {
    const [
      totalTournaments,
      activeTournaments,
      totalParticipants,
      totalPigeons,
      feeTotals,
    ] = await Promise.all([
      this.prisma.tournament.count({ where: { deletedAt: null } }),
      this.prisma.tournament.count({
        where: { deletedAt: null, status: TournamentStatus.ACTIVE },
      }),
      this.prisma.participant.count({
        where: { deletedAt: null, tournament: { deletedAt: null } },
      }),
      this.prisma.registrationPigeon.count({
        where: { deletedAt: null, tournament: { deletedAt: null } },
      }),
      this.prisma.tournamentRegistration.aggregate({
        where: { deletedAt: null, tournament: { deletedAt: null } },
        _sum: { totalFee: true, paidAmount: true },
      }),
    ]);

    return {
      totalTournaments,
      activeTournaments,
      totalParticipants,
      totalPigeons,
      totalEntryFees: Number(feeTotals._sum.totalFee ?? 0),
      totalPrizePool: Number(feeTotals._sum.paidAmount ?? 0),
    };
  }
}
