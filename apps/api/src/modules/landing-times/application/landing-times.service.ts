import {
  combineRaceDateAndLandingTime,
  combineReleaseDateTime,
  findDuplicateRegistrationPigeonIds,
  formatLandingTimeForInput,
} from '@kabootar/shared';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PigeonLandingTime, Prisma } from '@prisma/client';

import { liveTournamentWhere } from '../../../common/utils/tournament-identity.util';
import { PrismaService } from '../../../infrastructure/prisma/prisma.module';
import { RegistrationPigeonsService } from '../../registration-pigeons/application/registration-pigeons.service';
import { ResultsService } from '../../results/application/results.service';
import { BulkSaveLandingTimesDto } from '../presentation/dto/bulk-save-landing-times.dto';
import { CreateLandingTimeDto } from '../presentation/dto/create-landing-time.dto';
import { UpdateLandingTimeDto } from '../presentation/dto/update-landing-time.dto';

@Injectable()
export class LandingTimesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resultsService: ResultsService,
    private readonly registrationPigeonsService: RegistrationPigeonsService,
  ) {}

  async getEntrySheet(tournamentId: string, raceDayId: string, participantId?: string) {
    const [raceDay, tournament] = await Promise.all([
      this.getRaceDayOrThrow(tournamentId, raceDayId),
      this.getTournamentEntrySettings(tournamentId),
    ]);

    await this.registrationPigeonsService.ensureQuotaSlots(tournamentId);

    const registrations = await this.prisma.tournamentRegistration.findMany({
      where: {
        tournamentId,
        deletedAt: null,
        ...(participantId && { participantId }),
      },
      include: {
        participant: {
          select: { id: true, name: true, loftName: true, profileImage: true },
        },
        pigeons: {
          where: { deletedAt: null, status: 'ACTIVE' },
          include: {
            landingTimes: {
              where: { raceDayId, deletedAt: null },
              take: 1,
            },
          },
          orderBy: { pigeonNumber: 'asc' },
        },
      },
      orderBy: { participant: { name: 'asc' } },
    });

    return {
      tournamentId,
      raceDayId,
      raceDate: raceDay.raceDate.toISOString().slice(0, 10),
      releaseTime: raceDay.releaseTime,
      endTime: raceDay.endTime,
      status: raceDay.status,
      doubleStampEnabled: tournament.doubleStampEnabled,
      singleNominatedEnabled: tournament.singleNominatedEnabled,
      pigeonCount: tournament.pigeonCount,
      participants: registrations.map((registration) => ({
        participantId: registration.participantId,
        participantName: registration.participant.name,
        loftName: registration.participant.name,
        profileImage: registration.participant.profileImage,
        pigeons: registration.pigeons.map((pigeon) => {
          const landing = pigeon.landingTimes[0];
          return {
            registrationId: registration.id,
            registrationPigeonId: pigeon.id,
            pigeonNumber: pigeon.pigeonNumber,
            ringNumber: pigeon.ringNumber,
            landingTimeId: landing?.id ?? null,
            landingTime: landing ? formatLandingTimeForInput(landing.landingTime) : null,
            isDoubleStamp: pigeon.isDoubleStamp,
            isSingleNominated: pigeon.isSingleNominated ?? false,
            isPending: pigeon.isPending ?? false,
          };
        }),
      })),
    };
  }

  async findAll(tournamentId: string, raceDayId: string, participantId?: string) {
    await this.getRaceDayOrThrow(tournamentId, raceDayId);

    const items = await this.prisma.pigeonLandingTime.findMany({
      where: {
        tournamentId,
        raceDayId,
        deletedAt: null,
        ...(participantId && { participantId }),
      },
      orderBy: { landingTime: 'asc' },
    });

    return {
      items: items.map((item) => this.mapLandingTime(item)),
      total: items.length,
    };
  }

  async create(tournamentId: string, raceDayId: string, dto: CreateLandingTimeDto) {
    const raceDay = await this.getRaceDayOrThrow(tournamentId, raceDayId);
    await this.validatePigeonOwnership(tournamentId, dto.participantId, dto.registrationPigeonId);
    await this.assertNoDuplicateEntry(raceDayId, dto.registrationPigeonId);

    const landingTime = this.parseAndValidateLandingTime(raceDay, dto.landingTime);
    await this.applyNominatedFlags(
      dto.registrationPigeonId,
      dto,
      await this.getTournamentEntrySettings(tournamentId),
    );

    try {
      const record = await this.prisma.pigeonLandingTime.create({
        data: {
          tournamentId,
          raceDayId,
          participantId: dto.participantId,
          registrationPigeonId: dto.registrationPigeonId,
          landingTime,
        },
      });

      await this.refreshWinners(tournamentId, raceDayId);
      return this.mapLandingTime(record);
    } catch (error) {
      this.handleUniqueViolation(error);
      throw error;
    }
  }

  async bulkSave(tournamentId: string, raceDayId: string, dto: BulkSaveLandingTimesDto) {
    const raceDay = await this.getRaceDayOrThrow(tournamentId, raceDayId);
    const nominatedSettings = await this.getTournamentEntrySettings(tournamentId);
    const duplicateIds = findDuplicateRegistrationPigeonIds(
      dto.entries.map((entry) => entry.registrationPigeonId),
    );

    if (duplicateIds.length > 0) {
      throw new BadRequestException('Duplicate pigeon entries found in bulk save payload');
    }

    const saved: PigeonLandingTime[] = [];
    const errors: { registrationPigeonId: string; message: string }[] = [];
    let skipped = 0;

    for (const entry of dto.entries) {
      try {
        await this.validatePigeonOwnership(
          tournamentId,
          entry.participantId,
          entry.registrationPigeonId,
        );

        if (!entry.landingTime?.trim()) {
          skipped += 1;
          continue;
        }

        const landingTime = this.parseAndValidateLandingTime(raceDay, entry.landingTime);
        await this.applyNominatedFlags(entry.registrationPigeonId, entry, nominatedSettings);
        const existing = await this.prisma.pigeonLandingTime.findFirst({
          where: {
            raceDayId,
            registrationPigeonId: entry.registrationPigeonId,
            deletedAt: null,
          },
        });

        const record = existing
          ? await this.prisma.pigeonLandingTime.update({
              where: { id: existing.id },
              data: { landingTime, participantId: entry.participantId },
            })
          : await this.prisma.pigeonLandingTime.create({
              data: {
                tournamentId,
                raceDayId,
                participantId: entry.participantId,
                registrationPigeonId: entry.registrationPigeonId,
                landingTime,
              },
            });

        saved.push(record);
      } catch (error) {
        errors.push({
          registrationPigeonId: entry.registrationPigeonId,
          message: error instanceof Error ? error.message : 'Unable to save landing time',
        });
      }
    }

    await this.refreshWinners(tournamentId, raceDayId);

    return {
      saved: saved.map((item) => this.mapLandingTime(item)),
      skipped,
      errors,
    };
  }

  async update(tournamentId: string, raceDayId: string, id: string, dto: UpdateLandingTimeDto) {
    const raceDay = await this.getRaceDayOrThrow(tournamentId, raceDayId);
    const existing = await this.getLandingTimeOrThrow(tournamentId, raceDayId, id);
    const landingTime = this.parseAndValidateLandingTime(raceDay, dto.landingTime);

    const record = await this.prisma.pigeonLandingTime.update({
      where: { id },
      data: { landingTime },
    });

    await this.applyNominatedFlags(
      existing.registrationPigeonId,
      dto,
      await this.getTournamentEntrySettings(tournamentId),
    );

    await this.refreshWinners(tournamentId, raceDayId);
    return this.mapLandingTime(record);
  }

  async remove(tournamentId: string, raceDayId: string, id: string) {
    await this.getRaceDayOrThrow(tournamentId, raceDayId);
    await this.getLandingTimeOrThrow(tournamentId, raceDayId, id);

    const record = await this.prisma.pigeonLandingTime.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.refreshWinners(tournamentId, raceDayId);
    return this.mapLandingTime(record);
  }

  private async refreshWinners(tournamentId: string, raceDayId: string) {
    await this.resultsService.persistRaceDayWinners(tournamentId, raceDayId);
  }

  private async getRaceDayOrThrow(tournamentId: string, raceDayId: string) {
    const raceDay = await this.prisma.raceDay.findFirst({
      where: { id: raceDayId, tournamentId, deletedAt: null },
    });

    if (!raceDay) {
      throw new NotFoundException('Race day not found');
    }

    return raceDay;
  }

  private async getLandingTimeOrThrow(tournamentId: string, raceDayId: string, id: string) {
    const record = await this.prisma.pigeonLandingTime.findFirst({
      where: { id, tournamentId, raceDayId, deletedAt: null },
    });

    if (!record) {
      throw new NotFoundException('Landing time not found');
    }

    return record;
  }

  private async validatePigeonOwnership(
    tournamentId: string,
    participantId: string,
    registrationPigeonId: string,
  ) {
    const pigeon = await this.prisma.registrationPigeon.findFirst({
      where: {
        id: registrationPigeonId,
        tournamentId,
        participantId,
        deletedAt: null,
      },
    });

    if (!pigeon) {
      throw new BadRequestException('Pigeon does not belong to this participant in the tournament');
    }

    return pigeon;
  }

  private async getTournamentEntrySettings(tournamentId: string) {
    const tournament = await this.prisma.tournament.findFirst({
      where: liveTournamentWhere(tournamentId),
      select: {
        doubleStampEnabled: true,
        singleNominatedEnabled: true,
        totalPigeonsAllowed: true,
      },
    });

    return {
      doubleStampEnabled: tournament?.doubleStampEnabled ?? false,
      singleNominatedEnabled: tournament?.singleNominatedEnabled ?? false,
      pigeonCount: tournament?.totalPigeonsAllowed ?? 0,
    };
  }

  private async applyNominatedFlags(
    registrationPigeonId: string,
    flags: { isDoubleStamp?: boolean; isSingleNominated?: boolean },
    settings: { doubleStampEnabled: boolean; singleNominatedEnabled: boolean },
  ): Promise<void> {
    const data: { isDoubleStamp?: boolean; isSingleNominated?: boolean } = {};
    if (flags.isDoubleStamp !== undefined && settings.doubleStampEnabled) {
      data.isDoubleStamp = flags.isDoubleStamp;
    }
    if (flags.isSingleNominated !== undefined && settings.singleNominatedEnabled) {
      data.isSingleNominated = flags.isSingleNominated;
    }
    if (Object.keys(data).length === 0) return;

    await this.prisma.registrationPigeon.update({
      where: { id: registrationPigeonId },
      data,
    });
  }

  private async assertNoDuplicateEntry(raceDayId: string, registrationPigeonId: string) {
    const existing = await this.prisma.pigeonLandingTime.findFirst({
      where: { raceDayId, registrationPigeonId, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException('A landing time already exists for this pigeon on this race day');
    }
  }

  private parseLandingTime(raceDate: Date, value: string): Date {
    try {
      if (value.includes('T')) {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
          throw new Error('Landing time format is invalid');
        }
        return parsed;
      }

      return combineRaceDateAndLandingTime(raceDate.toISOString().slice(0, 10), value);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Landing time format is invalid',
      );
    }
  }

  private parseAndValidateLandingTime(
    raceDay: {
      raceDate: Date;
      releaseTime: string;
      endTime: string;
    },
    value: string,
  ): Date {
    const landingTime = this.parseLandingTime(raceDay.raceDate, value);
    const raceDate = raceDay.raceDate.toISOString().slice(0, 10);
    const startsAt = combineReleaseDateTime(raceDate, raceDay.releaseTime);
    const endsAt = combineReleaseDateTime(raceDate, raceDay.endTime);

    if (landingTime.getTime() < startsAt.getTime()) {
      throw new BadRequestException('Landing time cannot be before the race day start time');
    }

    if (landingTime.getTime() > endsAt.getTime()) {
      throw new BadRequestException('Landing time cannot be after the race day end time');
    }

    return landingTime;
  }

  private handleUniqueViolation(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('A landing time already exists for this pigeon on this race day');
    }
  }

  private mapLandingTime(record: PigeonLandingTime) {
    return {
      id: record.id,
      tournamentId: record.tournamentId,
      raceDayId: record.raceDayId,
      participantId: record.participantId,
      registrationPigeonId: record.registrationPigeonId,
      landingTime: record.landingTime.toISOString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
