import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PigeonSex,
  Prisma,
  RegistrationPaymentStatus,
  TournamentRegistration,
  TournamentStatus,
} from '@prisma/client';
import {
  buildQuotaPigeonNumbers,
  calculateRegistrationTotalFee,
  deriveRegistrationPaymentStatus,
  generateBulkRingNumber,
  generateReceiptNumber,
} from '@kabootar/shared';

import { PrismaService } from '../../../infrastructure/prisma/prisma.module';
import { CreateRegistrationDto } from '../presentation/dto/create-registration.dto';
import { RecordPaymentDto } from '../presentation/dto/record-payment.dto';
import { RegistrationQueryDto } from '../presentation/dto/registration-query.dto';
import { UpdateRegistrationDto } from '../presentation/dto/update-registration.dto';

const MUTABLE_TOURNAMENT_STATUSES = new Set<TournamentStatus>([
  TournamentStatus.DRAFT,
  TournamentStatus.ACTIVE,
]);

type RegistrationWithRelations = TournamentRegistration & {
  tournament?: {
    id: string;
    title: string;
    city: string;
    entryFee: Prisma.Decimal;
  };
  participant?: {
    id: string;
    tournamentId: string;
    name: string;
    fatherName: string;
    phone: string;
    city: string;
    address: string | null;
    loftName: string;
    profileImage: string | null;
  };
  payments?: {
    id: string;
    registrationId: string;
    amount: Prisma.Decimal;
    notes: string | null;
    paidAt: Date;
    createdAt: Date;
  }[];
};

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: RegistrationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TournamentRegistrationWhereInput = {
      deletedAt: null,
      ...(query.tournamentId && { tournamentId: query.tournamentId }),
      ...(query.participantId && { participantId: query.participantId }),
      ...(query.paymentStatus && { paymentStatus: query.paymentStatus }),
      ...(query.search && {
        OR: [
          { receiptNumber: { contains: query.search, mode: 'insensitive' } },
          { participant: { name: { contains: query.search, mode: 'insensitive' } } },
          { participant: { phone: { contains: query.search, mode: 'insensitive' } } },
          { participant: { loftName: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.tournamentRegistration.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: this.detailInclude(),
      }),
      this.prisma.tournamentRegistration.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapRegistrationDetail(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const registration = await this.getRegistrationOrThrow(id, true);
    return this.mapRegistrationDetail(registration);
  }

  async previewFee(
    tournamentId: string,
    pigeonCount: number,
    excludeRegistrationId?: string,
  ) {
    void excludeRegistrationId;
    const tournament = await this.ensureTournamentExists(tournamentId);
    await this.assertPigeonLimit(tournamentId, pigeonCount);

    const entryFeePerPigeon = Number(tournament.entryFee);

    return {
      entryFeePerPigeon,
      pigeonCount,
      totalFee: calculateRegistrationTotalFee(entryFeePerPigeon, pigeonCount),
      remainingPigeonSlots: Math.max(0, tournament.totalPigeonsAllowed - pigeonCount),
    };
  }

  async create(dto: CreateRegistrationDto) {
    const tournament = await this.getTournamentForMutation(dto.tournamentId);
    await this.assertUniquePhoneInTournament(dto.tournamentId, dto.participant.phone);

    const entryFeePerPigeon = Number(tournament.entryFee);
    const pigeonCount = tournament.totalPigeonsAllowed;
    const totalFee = calculateRegistrationTotalFee(entryFeePerPigeon, pigeonCount);
    const paidAmount = totalFee;
    const paymentStatus = RegistrationPaymentStatus.PAID;
    const receiptNumber = await this.generateUniqueReceiptNumber();

    try {
      const registration = await this.prisma.$transaction(async (tx) => {
        const participant = await tx.participant.create({
          data: {
            tournamentId: dto.tournamentId,
            name: dto.participant.name.trim(),
            fatherName: dto.participant.fatherName.trim(),
            phone: dto.participant.phone.trim(),
            city: dto.participant.city.trim(),
            address: dto.participant.address?.trim(),
            loftName: dto.participant.loftName.trim(),
          },
        });

        return tx.tournamentRegistration.create({
          data: {
            tournamentId: dto.tournamentId,
            participantId: participant.id,
            pigeonCount,
            entryFeePerPigeon,
            totalFee,
            paidAmount,
            paymentStatus,
            receiptNumber,
            ...(totalFee > 0 && {
              payments: {
                create: {
                  amount: totalFee,
                  notes: 'Paid at registration',
                },
              },
            }),
            pigeons: {
              create: buildQuotaPigeonNumbers(pigeonCount).map((pigeonNumber) => ({
                tournamentId: dto.tournamentId,
                participantId: participant.id,
                ringNumber: generateBulkRingNumber(
                  'P',
                  dto.tournamentId,
                  participant.id,
                  pigeonNumber,
                ),
                pigeonNumber,
                color: 'N/A',
                gender: PigeonSex.COCK,
              })),
            },
          },
          include: this.detailInclude(),
        });
      });

      return this.mapRegistrationDetail(registration);
    } catch (error) {
      this.handleUniqueViolation(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateRegistrationDto) {
    const existing = await this.getRegistrationOrThrow(id);
    await this.getTournamentForMutation(existing.tournamentId);

    if (!dto.participant) {
      return this.mapRegistrationDetail(existing);
    }

    await this.assertUniquePhoneInTournament(
      existing.tournamentId,
      dto.participant.phone,
      existing.participantId,
    );

    await this.prisma.participant.update({
      where: { id: existing.participantId },
      data: {
        name: dto.participant.name.trim(),
        fatherName: dto.participant.fatherName.trim(),
        phone: dto.participant.phone.trim(),
        city: dto.participant.city.trim(),
        address: dto.participant.address?.trim() || null,
        loftName: dto.participant.loftName.trim(),
      },
    });

    return this.findOne(id);
  }

  async recordPayment(id: string, dto: RecordPaymentDto) {
    const existing = await this.getRegistrationOrThrow(id);
    await this.getTournamentForMutation(existing.tournamentId);

    const totalFee = Number(existing.totalFee);
    const currentPaid = Number(existing.paidAmount);
    const nextPaid = Number((currentPaid + dto.amount).toFixed(2));

    if (nextPaid > totalFee) {
      throw new BadRequestException('Payment would exceed the total registration fee');
    }

    const paymentStatus = this.toPrismaPaymentStatus(
      deriveRegistrationPaymentStatus(totalFee, nextPaid),
    );

    const registration = await this.prisma.$transaction(async (tx) => {
      await tx.registrationPayment.create({
        data: {
          registrationId: id,
          amount: dto.amount,
          notes: dto.notes,
        },
      });

      return tx.tournamentRegistration.update({
        where: { id },
        data: {
          paidAmount: nextPaid,
          paymentStatus,
        },
        include: this.detailInclude(),
      });
    });

    return this.mapRegistrationDetail(registration);
  }

  async remove(id: string) {
    const existing = await this.getRegistrationOrThrow(id);
    await this.getTournamentForMutation(existing.tournamentId);

    const registration = await this.prisma.$transaction(async (tx) => {
      const deletedAt = new Date();

      await tx.participant.update({
        where: { id: existing.participantId },
        data: { deletedAt },
      });

      await tx.registrationPigeon.updateMany({
        where: { registrationId: id, deletedAt: null },
        data: { deletedAt },
      });

      return tx.tournamentRegistration.update({
        where: { id },
        data: { deletedAt },
        include: this.detailInclude(),
      });
    });

    return this.mapRegistrationDetail(registration);
  }

  async assertPigeonLimit(tournamentId: string, requestedCount: number): Promise<void> {
    const tournament = await this.ensureTournamentExists(tournamentId);

    if (requestedCount > tournament.totalPigeonsAllowed) {
      throw new BadRequestException(
        `Each participant may have at most ${tournament.totalPigeonsAllowed} pigeon(s)`,
      );
    }
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
        'Registrations can only be managed when the tournament is Draft or Active',
      );
    }

    return tournament;
  }

  private async assertUniquePhoneInTournament(
    tournamentId: string,
    phone: string,
    excludeParticipantId?: string,
  ) {
    const existing = await this.prisma.participant.findFirst({
      where: {
        tournamentId,
        phone: phone.trim(),
        deletedAt: null,
        ...(excludeParticipantId && { NOT: { id: excludeParticipantId } }),
      },
    });

    if (existing) {
      throw new ConflictException(
        'A participant with this phone number is already registered in this tournament',
      );
    }
  }

  private async getRegistrationOrThrow(id: string, withPayments = false) {
    const registration = await this.prisma.tournamentRegistration.findFirst({
      where: { id, deletedAt: null },
      include: withPayments
        ? {
            ...this.detailInclude(),
            payments: {
              orderBy: { paidAt: 'desc' },
            },
          }
        : undefined,
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    return registration as RegistrationWithRelations;
  }

  private async generateUniqueReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    const count = await this.prisma.tournamentRegistration.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear,
        },
      },
    });

    return generateReceiptNumber(year, count + 1);
  }

  private detailInclude() {
    return {
      tournament: {
        select: {
          id: true,
          title: true,
          city: true,
          entryFee: true,
        },
      },
      participant: {
        select: {
          id: true,
          tournamentId: true,
          name: true,
          fatherName: true,
          phone: true,
          city: true,
          address: true,
          loftName: true,
          profileImage: true,
        },
      },
    } satisfies Prisma.TournamentRegistrationInclude;
  }

  private handleUniqueViolation(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A participant with this phone number is already registered in this tournament',
      );
    }
  }

  private toPrismaPaymentStatus(
    status: 'PENDING' | 'PARTIAL' | 'PAID',
  ): RegistrationPaymentStatus {
    return status as RegistrationPaymentStatus;
  }

  private mapRegistrationDetail(registration: RegistrationWithRelations) {
    return {
      id: registration.id,
      tournamentId: registration.tournamentId,
      participantId: registration.participantId,
      pigeonCount: registration.pigeonCount,
      entryFeePerPigeon: Number(registration.entryFeePerPigeon),
      totalFee: Number(registration.totalFee),
      paidAmount: Number(registration.paidAmount),
      paymentStatus: registration.paymentStatus,
      receiptNumber: registration.receiptNumber,
      createdAt: registration.createdAt.toISOString(),
      updatedAt: registration.updatedAt.toISOString(),
      ...(registration.tournament && {
        tournament: {
          id: registration.tournament.id,
          title: registration.tournament.title,
          city: registration.tournament.city,
          entryFee: Number(registration.tournament.entryFee),
        },
      }),
      ...(registration.participant && {
        participant: registration.participant,
      }),
      ...(registration.payments && {
        payments: registration.payments.map((payment) => ({
          id: payment.id,
          registrationId: payment.registrationId,
          amount: Number(payment.amount),
          notes: payment.notes,
          paidAt: payment.paidAt.toISOString(),
          createdAt: payment.createdAt.toISOString(),
        })),
      }),
    };
  }
}
