import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PigeonSex,
  PigeonStatus,
  Prisma,
  RegistrationPigeon,
  TournamentStatus,
} from '@prisma/client';
import {
  buildQuotaPigeonNumbers,
  calculateRegistrationTotalFee,
  deriveRegistrationPaymentStatus,
  generateBulkRingNumber,
  getNextPigeonNumber,
} from '@kabootar/shared';

import { PrismaService } from '../../../infrastructure/prisma/prisma.module';
import { BulkGeneratePigeonsDto } from '../presentation/dto/bulk-generate-pigeons.dto';
import { CreateRegistrationPigeonDto } from '../presentation/dto/create-registration-pigeon.dto';
import { UpdateRegistrationPigeonDto } from '../presentation/dto/update-registration-pigeon.dto';

const MUTABLE_TOURNAMENT_STATUSES = new Set<TournamentStatus>([
  TournamentStatus.DRAFT,
  TournamentStatus.ACTIVE,
]);

const QUOTA_PIGEON_COLOR = 'N/A';

@Injectable()
export class RegistrationPigeonsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByRegistration(registrationId: string) {
    const registration = await this.getRegistrationOrThrow(registrationId);
    const items = await this.prisma.registrationPigeon.findMany({
      where: { registrationId, deletedAt: null },
      orderBy: { pigeonNumber: 'asc' },
    });

    return this.buildListResponse(registration, items);
  }

  async findOne(registrationId: string, id: string) {
    const pigeon = await this.getPigeonOrThrow(registrationId, id);
    return this.mapPigeon(pigeon);
  }

  async create(registrationId: string, dto: CreateRegistrationPigeonDto) {
    const registration = await this.getRegistrationForMutation(registrationId);
    await this.assertParticipantPigeonQuota(registration, 1);

    const existingNumbers = await this.getExistingPigeonNumbers(registrationId);
    const pigeonNumber = dto.pigeonNumber ?? getNextPigeonNumber(existingNumbers);

    if (existingNumbers.includes(pigeonNumber)) {
      throw new ConflictException(`Pigeon number ${pigeonNumber} is already assigned`);
    }

    await this.assertUniqueRingNumber(registration.tournamentId, dto.ringNumber);
    this.assertDoubleStampAllowed(registration.tournament.doubleStampEnabled, dto.isDoubleStamp);

    try {
      const pigeon = await this.prisma.$transaction(async (tx) => {
        const created = await tx.registrationPigeon.create({
          data: {
            registrationId,
            tournamentId: registration.tournamentId,
            participantId: registration.participantId,
            ringNumber: dto.ringNumber.trim(),
            pigeonNumber,
            color: dto.color.trim(),
            gender: dto.gender,
            isDoubleStamp: dto.isDoubleStamp ?? false,
            status: dto.status ?? PigeonStatus.ACTIVE,
          },
        });

        await this.syncRegistrationPigeonTotals(tx, registration);
        return created;
      });

      return this.mapPigeon(pigeon);
    } catch (error) {
      this.handleUniqueViolation(error);
      throw error;
    }
  }

  async bulkGenerate(registrationId: string, dto: BulkGeneratePigeonsDto) {
    const registration = await this.getRegistrationForMutation(registrationId);
    const existingCount = await this.countPigeons(registrationId);
    const remaining = Math.max(0, registration.tournament.totalPigeonsAllowed - existingCount);

    if (remaining === 0) {
      throw new BadRequestException(
        `Each participant already has ${registration.tournament.totalPigeonsAllowed} pigeon(s)`,
      );
    }

    const existingNumbers = await this.getExistingPigeonNumbers(registrationId);
    const color = dto.color?.trim() || 'Mixed';
    const gender = dto.gender ?? PigeonSex.COCK;
    const ringPrefix = dto.ringPrefix?.trim() || 'PK';

    const created = await this.prisma.$transaction(async (tx) => {
      const rows: RegistrationPigeon[] = [];
      let nextNumber = getNextPigeonNumber(existingNumbers);

      for (let index = 0; index < remaining; index += 1) {
        const ringNumber = generateBulkRingNumber(
          ringPrefix,
          registration.tournamentId,
          registration.participantId,
          nextNumber,
        );

        const pigeon = await tx.registrationPigeon.create({
          data: {
            registrationId,
            tournamentId: registration.tournamentId,
            participantId: registration.participantId,
            ringNumber,
            pigeonNumber: nextNumber,
            color,
            gender,
            isDoubleStamp: false,
            status: PigeonStatus.ACTIVE,
          },
        });

        rows.push(pigeon);
        nextNumber += 1;
      }

      await this.syncRegistrationPigeonTotals(tx, registration);
      return rows;
    });

    const registeredCount = existingCount + created.length;

    return {
      created: created.map((item) => this.mapPigeon(item)),
      assignedCount: registeredCount,
      registeredCount,
      remainingCount: 0,
    };
  }

  async update(registrationId: string, id: string, dto: UpdateRegistrationPigeonDto) {
    const registration = await this.getRegistrationForMutation(registrationId);
    const existing = await this.getPigeonOrThrow(registrationId, id);

    if (dto.pigeonNumber !== undefined && dto.pigeonNumber !== existing.pigeonNumber) {
      const duplicate = await this.prisma.registrationPigeon.findFirst({
        where: {
          registrationId,
          deletedAt: null,
          pigeonNumber: dto.pigeonNumber,
          NOT: { id },
        },
      });

      if (duplicate) {
        throw new ConflictException(`Pigeon number ${dto.pigeonNumber} is already assigned`);
      }
    }

    if (dto.ringNumber && dto.ringNumber.trim() !== existing.ringNumber) {
      await this.assertUniqueRingNumber(registration.tournamentId, dto.ringNumber, id);
    }

    this.assertDoubleStampAllowed(registration.tournament.doubleStampEnabled, dto.isDoubleStamp);

    try {
      const pigeon = await this.prisma.registrationPigeon.update({
        where: { id },
        data: {
          ...(dto.ringNumber !== undefined && { ringNumber: dto.ringNumber.trim() }),
          ...(dto.pigeonNumber !== undefined && { pigeonNumber: dto.pigeonNumber }),
          ...(dto.color !== undefined && { color: dto.color.trim() }),
          ...(dto.gender !== undefined && { gender: dto.gender }),
          ...(dto.isDoubleStamp !== undefined && { isDoubleStamp: dto.isDoubleStamp }),
          ...(dto.status !== undefined && { status: dto.status }),
        },
      });

      return this.mapPigeon(pigeon);
    } catch (error) {
      this.handleUniqueViolation(error);
      throw error;
    }
  }

  async toggleDoubleStamp(registrationId: string, id: string) {
    const registration = await this.getRegistrationForMutation(registrationId);
    this.assertDoubleStampAllowed(registration.tournament.doubleStampEnabled, true);
    const existing = await this.getPigeonOrThrow(registrationId, id);

    const pigeon = await this.prisma.registrationPigeon.update({
      where: { id },
      data: { isDoubleStamp: !existing.isDoubleStamp },
    });

    return this.mapPigeon(pigeon);
  }

  async remove(registrationId: string, id: string) {
    const registration = await this.getRegistrationForMutation(registrationId);
    await this.getPigeonOrThrow(registrationId, id);

    const pigeon = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.registrationPigeon.update({
        where: { id },
        data: { deletedAt: new Date(), status: PigeonStatus.RETIRED },
      });

      await this.syncRegistrationPigeonTotals(tx, registration);
      return updated;
    });

    return this.mapPigeon(pigeon);
  }

  async ensureQuotaSlots(tournamentId: string): Promise<void> {
    const tournament = await this.prisma.tournament.findFirst({
      where: { id: tournamentId, deletedAt: null },
      select: { totalPigeonsAllowed: true },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const quota = tournament.totalPigeonsAllowed;
    const registrations = await this.prisma.tournamentRegistration.findMany({
      where: { tournamentId, deletedAt: null },
      include: {
        pigeons: {
          select: { id: true, pigeonNumber: true, deletedAt: true },
        },
      },
    });

    const registrationsNeedingSlots = registrations.filter((registration) => {
      const byNumber = new Map(registration.pigeons.map((pigeon) => [pigeon.pigeonNumber, pigeon]));
      return (
        registration.pigeonCount !== quota ||
        buildQuotaPigeonNumbers(quota).some((pigeonNumber) => {
          const existing = byNumber.get(pigeonNumber);
          return !existing || Boolean(existing.deletedAt);
        })
      );
    });

    if (registrationsNeedingSlots.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      for (const registration of registrationsNeedingSlots) {
        const byNumber = new Map(registration.pigeons.map((pigeon) => [pigeon.pigeonNumber, pigeon]));
        let changed = false;

        for (const pigeonNumber of buildQuotaPigeonNumbers(quota)) {
          const existing = byNumber.get(pigeonNumber);
          if (!existing) {
            await tx.registrationPigeon.create({
              data: {
                registrationId: registration.id,
                tournamentId,
                participantId: registration.participantId,
                ringNumber: generateBulkRingNumber(
                  'P',
                  tournamentId,
                  registration.participantId,
                  pigeonNumber,
                ),
                pigeonNumber,
                color: QUOTA_PIGEON_COLOR,
                gender: PigeonSex.COCK,
              },
            });
            changed = true;
            continue;
          }

          if (existing.deletedAt) {
            await tx.registrationPigeon.update({
              where: { id: existing.id },
              data: { deletedAt: null, status: PigeonStatus.ACTIVE },
            });
            changed = true;
          }
        }

        if (changed || registration.pigeonCount !== quota) {
          await this.syncRegistrationPigeonTotals(tx, registration);
        }
      }
    });
  }

  private async assertParticipantPigeonQuota(
    registration: { id: string; tournament: { totalPigeonsAllowed: number } },
    addingCount: number,
  ) {
    const existingCount = await this.countPigeons(registration.id);
    const remaining = Math.max(0, registration.tournament.totalPigeonsAllowed - existingCount);

    if (addingCount > remaining) {
      throw new BadRequestException(
        `Each participant may have at most ${registration.tournament.totalPigeonsAllowed} pigeon(s)`,
      );
    }
  }

  private async syncRegistrationPigeonTotals(
    tx: Prisma.TransactionClient,
    registration: { id: string; entryFeePerPigeon: Prisma.Decimal; paidAmount: Prisma.Decimal },
  ) {
    const pigeonCount = await tx.registrationPigeon.count({
      where: { registrationId: registration.id, deletedAt: null },
    });
    const totalFee = calculateRegistrationTotalFee(
      Number(registration.entryFeePerPigeon),
      pigeonCount,
    );
    const paymentStatus = deriveRegistrationPaymentStatus(
      totalFee,
      Number(registration.paidAmount),
    );

    await tx.tournamentRegistration.update({
      where: { id: registration.id },
      data: { pigeonCount, totalFee, paymentStatus },
    });
  }

  private async getRegistrationOrThrow(registrationId: string) {
    const registration = await this.prisma.tournamentRegistration.findFirst({
      where: { id: registrationId, deletedAt: null },
      include: {
        tournament: {
          select: { id: true, status: true, doubleStampEnabled: true, totalPigeonsAllowed: true },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    return registration;
  }

  private async getRegistrationForMutation(registrationId: string) {
    const registration = await this.getRegistrationOrThrow(registrationId);

    if (!MUTABLE_TOURNAMENT_STATUSES.has(registration.tournament.status)) {
      throw new BadRequestException(
        'Pigeons can only be managed when the tournament is Draft or Active',
      );
    }

    return registration;
  }

  private assertDoubleStampAllowed(enabled: boolean, isDoubleStamp?: boolean): void {
    if (isDoubleStamp && !enabled) {
      throw new BadRequestException('Double stamp is not enabled for this tournament');
    }
  }

  private async getPigeonOrThrow(registrationId: string, id: string) {
    const pigeon = await this.prisma.registrationPigeon.findFirst({
      where: { id, registrationId, deletedAt: null },
    });

    if (!pigeon) {
      throw new NotFoundException('Pigeon not found');
    }

    return pigeon;
  }

  private async countPigeons(registrationId: string): Promise<number> {
    return this.prisma.registrationPigeon.count({
      where: { registrationId, deletedAt: null },
    });
  }

  private async getExistingPigeonNumbers(registrationId: string): Promise<number[]> {
    const rows = await this.prisma.registrationPigeon.findMany({
      where: { registrationId, deletedAt: null },
      select: { pigeonNumber: true },
    });

    return rows.map((row) => row.pigeonNumber);
  }

  private async assertUniqueRingNumber(
    tournamentId: string,
    ringNumber: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.registrationPigeon.findFirst({
      where: {
        tournamentId,
        deletedAt: null,
        ringNumber: ringNumber.trim(),
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    });

    if (existing) {
      throw new ConflictException('A pigeon with this ring number already exists in the tournament');
    }
  }

  private handleUniqueViolation(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Pigeon number or ring number already exists');
    }
  }

  private async buildListResponse(
    registration: { tournament: { totalPigeonsAllowed: number } },
    items: RegistrationPigeon[],
  ) {
    const registeredCount = items.length;
    const remainingCount = Math.max(0, registration.tournament.totalPigeonsAllowed - registeredCount);

    return {
      items: items.map((item) => this.mapPigeon(item)),
      assignedCount: registeredCount,
      registeredCount,
      remainingCount,
    };
  }

  private mapPigeon(pigeon: RegistrationPigeon) {
    return {
      id: pigeon.id,
      registrationId: pigeon.registrationId,
      tournamentId: pigeon.tournamentId,
      participantId: pigeon.participantId,
      ringNumber: pigeon.ringNumber,
      pigeonNumber: pigeon.pigeonNumber,
      color: pigeon.color,
      gender: pigeon.gender,
      isDoubleStamp: pigeon.isDoubleStamp,
      status: pigeon.status,
      createdAt: pigeon.createdAt.toISOString(),
      updatedAt: pigeon.updatedAt.toISOString(),
    };
  }
}
