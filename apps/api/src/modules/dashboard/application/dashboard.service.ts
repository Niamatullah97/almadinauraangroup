import { calculateRegistrationTotalFee, collectedRegistrationFee } from '@kabootar/shared';
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
    const [totalTournaments, activeTournaments, totalParticipants, totalPigeons, registrations] =
      await Promise.all([
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
        this.prisma.tournamentRegistration.findMany({
          where: { deletedAt: null, tournament: { deletedAt: null } },
          select: { entryFeePerPigeon: true, paidAmount: true },
        }),
      ]);

    const totalEntryFees = registrations.reduce(
      (sum, row) => sum + calculateRegistrationTotalFee(Number(row.entryFeePerPigeon)),
      0,
    );
    const totalPrizePool = registrations.reduce(
      (sum, row) =>
        sum + collectedRegistrationFee(Number(row.entryFeePerPigeon), Number(row.paidAmount)),
      0,
    );

    return {
      totalTournaments,
      activeTournaments,
      totalParticipants,
      totalPigeons,
      totalEntryFees,
      totalPrizePool,
    };
  }
}
