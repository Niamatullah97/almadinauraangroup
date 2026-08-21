import { Injectable, NotFoundException } from '@nestjs/common';
import { RaceWinnerCategory } from '@prisma/client';

import {
  DailyResultDto,
  DoubleStampResultDto,
  ResultWinner,
  TotalResultDto,
  TournamentResultInput,
  calculateDailyResults,
  calculateDoubleStampResults,
  calculateTotalResults,
  toDailyPigeonInputs,
} from '@kabootar/shared';
import { PrismaService } from '../../../infrastructure/prisma/prisma.module';

const WINNER_CATEGORIES = [
  ['FIRST', 'firstWinner'],
  ['LAST', 'lastWinner'],
  ['AVERAGE', 'averageWinner'],
  ['BRAVE', 'bravePigeon'],
] as const;

export interface TournamentExportRaceDay {
  daily: DailyResultDto;
  doubleStamp: DoubleStampResultDto;
}

export interface TournamentExportBundle {
  raceDays: TournamentExportRaceDay[];
  total: TotalResultDto;
  doubleStampTotal: DoubleStampResultDto;
}

@Injectable()
export class ResultsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyResults(tournamentId: string, raceDayId: string) {
    const input = await this.buildTournamentInput(tournamentId);
    const raceDay = input.raceDays.find((day) => day.raceDayId === raceDayId);

    if (!raceDay) {
      throw new NotFoundException('Race day not found');
    }

    const pigeons = toDailyPigeonInputs(input, raceDayId);
    const window = { startTime: input.startTime, endTime: input.endTime };
    return calculateDailyResults(raceDay, pigeons, window, {
      totalPigeonsAllowed: input.totalPigeonsAllowed,
    });
  }

  async getTotalResults(tournamentId: string) {
    const input = await this.buildTournamentInput(tournamentId);
    return calculateTotalResults(input);
  }

  async getDailyDoubleStampResults(tournamentId: string, raceDayId: string) {
    const input = await this.buildTournamentInput(tournamentId);
    const raceDay = input.raceDays.find((day) => day.raceDayId === raceDayId);

    if (!raceDay) {
      throw new NotFoundException('Race day not found');
    }

    const pigeons = toDailyPigeonInputs(input, raceDayId);
    const window = { startTime: input.startTime, endTime: input.endTime };
    return calculateDoubleStampResults('daily', pigeons, window, raceDay, undefined, {
      totalPigeonsAllowed: undefined,
    });
  }

  async getTotalDoubleStampResults(tournamentId: string) {
    const input = await this.buildTournamentInput(tournamentId);
    const window = { startTime: input.startTime, endTime: input.endTime };
    return calculateDoubleStampResults('total', input.pigeons, window, undefined, input, {
      totalPigeonsAllowed: undefined,
    });
  }

  async getCompleteResults(tournamentId: string): Promise<TournamentExportBundle> {
    const input = await this.buildTournamentInput(tournamentId);
    const window = { startTime: input.startTime, endTime: input.endTime };
    const dailyOptions = { totalPigeonsAllowed: input.totalPigeonsAllowed };

    const raceDays = input.raceDays.map((raceDay) => {
      const pigeons = toDailyPigeonInputs(input, raceDay.raceDayId);
      return {
        daily: calculateDailyResults(raceDay, pigeons, window, dailyOptions),
        doubleStamp: calculateDoubleStampResults('daily', pigeons, window, raceDay, undefined, {
          totalPigeonsAllowed: undefined,
        }),
      };
    });

    return {
      raceDays,
      total: calculateTotalResults(input, dailyOptions),
      doubleStampTotal: calculateDoubleStampResults(
        'total',
        input.pigeons,
        window,
        undefined,
        input,
        { totalPigeonsAllowed: undefined },
      ),
    };
  }

  async persistRaceDayWinners(tournamentId: string, raceDayId: string) {
    const results = await this.getDailyResults(tournamentId, raceDayId);
    const winners: Record<(typeof WINNER_CATEGORIES)[number][1], ResultWinner | null> = {
      firstWinner: results.firstWinner,
      lastWinner: results.lastWinner,
      averageWinner: results.averageWinner,
      bravePigeon: results.bravePigeon,
    };

    for (const [category, key] of WINNER_CATEGORIES) {
      const winner = winners[key];

      if (!winner) {
        await this.prisma.raceDayWinner.deleteMany({
          where: { raceDayId, category: category as RaceWinnerCategory },
        });
        continue;
      }

      await this.prisma.raceDayWinner.upsert({
        where: {
          raceDayId_category: {
            raceDayId,
            category: category as RaceWinnerCategory,
          },
        },
        create: {
          raceDayId,
          category: category as RaceWinnerCategory,
          participantId: winner.participantId,
          registrationPigeonId: winner.registrationPigeonId ?? null,
          valueMs: Math.round(winner.valueMs),
          landingClockTime: winner.landingClockTime ?? null,
        },
        update: {
          participantId: winner.participantId,
          registrationPigeonId: winner.registrationPigeonId ?? null,
          valueMs: Math.round(winner.valueMs),
          landingClockTime: winner.landingClockTime ?? null,
        },
      });
    }

    return {
      firstWinner: results.firstWinner,
      lastWinner: results.lastWinner,
      averageWinner: results.averageWinner,
      bravePigeon: results.bravePigeon,
    };
  }

  private async buildTournamentInput(tournamentId: string): Promise<TournamentResultInput> {
    const tournament = await this.prisma.tournament.findFirst({
      where: { id: tournamentId, deletedAt: null },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const [raceDays, pigeons] = await Promise.all([
      this.prisma.raceDay.findMany({
        where: { tournamentId, deletedAt: null },
        orderBy: { raceDate: 'asc' },
      }),
      this.prisma.registrationPigeon.findMany({
        where: { tournamentId, deletedAt: null, status: 'ACTIVE' },
        include: {
          participant: {
            select: { id: true, name: true, loftName: true, profileImage: true },
          },
          landingTimes: {
            where: { deletedAt: null },
          },
        },
        orderBy: [{ participant: { name: 'asc' } }, { pigeonNumber: 'asc' }],
      }),
    ]);

    return {
      tournamentId,
      startDate: tournament.startDate.toISOString().slice(0, 10),
      endDate: tournament.endDate.toISOString().slice(0, 10),
      startTime: tournament.startTime,
      endTime: tournament.endTime,
      totalPigeonsAllowed: tournament.totalPigeonsAllowed,
      status: tournament.status,
      raceDays: raceDays.map((raceDay) => ({
        raceDayId: raceDay.id,
        raceDate: raceDay.raceDate.toISOString().slice(0, 10),
        releaseTime: raceDay.releaseTime,
        endTime: raceDay.endTime,
        status: raceDay.status,
      })),
      pigeons: pigeons.map((pigeon) => ({
        registrationPigeonId: pigeon.id,
        participantId: pigeon.participantId,
        participantName: pigeon.participant.name,
        loftName: pigeon.participant.loftName,
        profileImage: pigeon.participant.profileImage,
        pigeonNumber: pigeon.pigeonNumber,
        ringNumber: pigeon.ringNumber,
        isDoubleStamp: pigeon.isDoubleStamp,
        landings: pigeon.landingTimes.map((landing) => ({
          raceDayId: landing.raceDayId,
          landingTime: landing.landingTime,
        })),
      })),
    };
  }
}
