import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RaceDay, RaceDayStatus, TournamentStatus } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.module';
import { ResultsService } from '../../results/application/results.service';
import { CreateRaceDayDto } from '../presentation/dto/create-race-day.dto';
import { UpdateRaceDayDto } from '../presentation/dto/update-race-day.dto';

const MUTABLE_TOURNAMENT_STATUSES = new Set<TournamentStatus>([
  TournamentStatus.DRAFT,
  TournamentStatus.ACTIVE,
]);

@Injectable()
export class RaceDaysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resultsService: ResultsService,
  ) {}

  async findAllByTournament(tournamentId: string) {
    await this.ensureTournamentExists(tournamentId);

    const items = await this.prisma.raceDay.findMany({
      where: { tournamentId, deletedAt: null },
      orderBy: { raceDate: 'asc' },
    });

    return items.map((item) => this.mapRaceDay(item));
  }

  async findOne(tournamentId: string, id: string) {
    const raceDay = await this.getRaceDayOrThrow(tournamentId, id);
    return this.mapRaceDay(raceDay);
  }

  async create(tournamentId: string, dto: CreateRaceDayDto) {
    const tournament = await this.getTournamentForMutation(tournamentId);
    this.assertRaceDateInRange(dto.raceDate, tournament.startDate, tournament.endDate);
    this.assertValidTimeWindow(dto.releaseTime, dto.endTime);
    await this.assertUniqueRaceDate(tournamentId, dto.raceDate);

    try {
      const raceDay = await this.prisma.raceDay.create({
        data: {
          tournamentId,
          raceDate: new Date(dto.raceDate),
          releaseTime: dto.releaseTime,
          endTime: dto.endTime,
          releaseLocation: dto.releaseLocation,
          weatherNotes: dto.weatherNotes,
          status: dto.status ?? RaceDayStatus.PENDING,
        },
      });

      return this.mapRaceDay(raceDay);
    } catch (error) {
      this.handleUniqueViolation(error);
      throw error;
    }
  }

  async update(tournamentId: string, id: string, dto: UpdateRaceDayDto) {
    const tournament = await this.getTournamentForMutation(tournamentId);
    const existing = await this.getRaceDayOrThrow(tournamentId, id);
    this.assertValidTimeWindow(
      dto.releaseTime ?? existing.releaseTime,
      dto.endTime ?? existing.endTime,
    );

    if (dto.raceDate) {
      this.assertRaceDateInRange(dto.raceDate, tournament.startDate, tournament.endDate);
      if (this.toDateKey(dto.raceDate) !== this.toDateKey(existing.raceDate)) {
        await this.assertUniqueRaceDate(tournamentId, dto.raceDate, id);
      }
    }

    try {
      const raceDay = await this.prisma.raceDay.update({
        where: { id },
        data: {
          ...(dto.raceDate !== undefined && { raceDate: new Date(dto.raceDate) }),
          ...(dto.releaseTime !== undefined && { releaseTime: dto.releaseTime }),
          ...(dto.endTime !== undefined && { endTime: dto.endTime }),
          ...(dto.releaseLocation !== undefined && { releaseLocation: dto.releaseLocation }),
          ...(dto.weatherNotes !== undefined && { weatherNotes: dto.weatherNotes }),
          ...(dto.status !== undefined && { status: dto.status }),
        },
      });

      if (raceDay.status === RaceDayStatus.LIVE || raceDay.status === RaceDayStatus.COMPLETED) {
        await this.resultsService.persistRaceDayWinners(tournamentId, id);
      }

      return this.mapRaceDay(raceDay);
    } catch (error) {
      this.handleUniqueViolation(error);
      throw error;
    }
  }

  async remove(tournamentId: string, id: string) {
    await this.getTournamentForMutation(tournamentId);
    await this.getRaceDayOrThrow(tournamentId, id);

    const raceDay = await this.prisma.raceDay.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return this.mapRaceDay(raceDay);
  }

  private async ensureTournamentExists(tournamentId: string) {
    const tournament = await this.prisma.tournament.findFirst({
      where: { id: tournamentId, deletedAt: null },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return tournament;
  }

  private async getTournamentForMutation(tournamentId: string) {
    const tournament = await this.ensureTournamentExists(tournamentId);

    if (!MUTABLE_TOURNAMENT_STATUSES.has(tournament.status)) {
      throw new BadRequestException(
        'Race days can only be managed when the tournament is Draft or Active',
      );
    }

    return tournament;
  }

  private async getRaceDayOrThrow(tournamentId: string, id: string) {
    const raceDay = await this.prisma.raceDay.findFirst({
      where: { id, tournamentId, deletedAt: null },
    });

    if (!raceDay) {
      throw new NotFoundException('Race day not found');
    }

    return raceDay;
  }

  private async assertUniqueRaceDate(tournamentId: string, raceDate: string, excludeId?: string) {
    const existing = await this.prisma.raceDay.findFirst({
      where: {
        tournamentId,
        deletedAt: null,
        raceDate: new Date(raceDate),
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    });

    if (existing) {
      throw new ConflictException('A race day already exists for this date in this tournament');
    }
  }

  private assertRaceDateInRange(raceDate: string, startDate: Date, endDate: Date) {
    const date = new Date(raceDate);
    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    date.setHours(0, 0, 0, 0);

    if (date < start || date > end) {
      throw new BadRequestException('Race date must fall within the tournament schedule');
    }
  }

  private assertValidTimeWindow(releaseTime: string, endTime: string) {
    if (endTime <= releaseTime) {
      throw new BadRequestException('Race day end time must be after its release time');
    }
  }

  private handleUniqueViolation(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('A race day already exists for this date in this tournament');
    }
  }

  private toDateKey(date: Date | string): string {
    const value = typeof date === 'string' ? new Date(date) : date;
    return value.toISOString().slice(0, 10);
  }

  private mapRaceDay(raceDay: RaceDay) {
    return {
      id: raceDay.id,
      tournamentId: raceDay.tournamentId,
      raceDate: raceDay.raceDate.toISOString().slice(0, 10),
      releaseTime: raceDay.releaseTime,
      endTime: raceDay.endTime,
      releaseLocation: raceDay.releaseLocation,
      weatherNotes: raceDay.weatherNotes,
      status: raceDay.status,
      createdAt: raceDay.createdAt.toISOString(),
      updatedAt: raceDay.updatedAt.toISOString(),
    };
  }
}
