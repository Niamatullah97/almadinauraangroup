import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Participant, Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.module';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { CreateParticipantDto } from '../presentation/dto/create-participant.dto';
import { ParticipantQueryDto } from '../presentation/dto/participant-query.dto';
import { UpdateParticipantDto } from '../presentation/dto/update-participant.dto';

const SORTABLE_FIELDS = new Set(['name', 'city', 'loftName', 'createdAt']);

@Injectable()
export class ParticipantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findAll(query: ParticipantQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ParticipantWhereInput = {
      deletedAt: null,
      ...(query.tournamentId && { tournamentId: query.tournamentId }),
      ...(query.city && {
        city: { equals: query.city, mode: 'insensitive' },
      }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { fatherName: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search, mode: 'insensitive' } },
          { city: { contains: query.search, mode: 'insensitive' } },
          { loftName: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy = this.buildOrderBy(query.sortBy, query.sortOrder);

    const [items, total] = await Promise.all([
      this.prisma.participant.findMany({
        skip,
        take: limit,
        where,
        orderBy,
      }),
      this.prisma.participant.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapParticipant(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const participant = await this.prisma.participant.findFirst({
      where: { id, deletedAt: null },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    return this.mapParticipant(participant);
  }

  async create(dto: CreateParticipantDto) {
    await this.assertUniquePhone(dto.tournamentId, dto.phone);

    try {
      const participant = await this.prisma.participant.create({
        data: {
          tournamentId: dto.tournamentId,
          name: dto.name.trim(),
          fatherName: dto.fatherName.trim(),
          phone: dto.phone.trim(),
          city: dto.city.trim(),
          address: dto.address?.trim(),
          loftName: dto.loftName.trim(),
        },
      });

      return this.mapParticipant(participant);
    } catch (error) {
      this.handleUniqueViolation(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateParticipantDto) {
    const existing = await this.findOne(id);

    if (dto.phone && dto.phone.trim() !== existing.phone) {
      await this.assertUniquePhone(existing.tournamentId, dto.phone.trim(), id);
    }

    try {
      const participant = await this.prisma.participant.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.fatherName !== undefined && { fatherName: dto.fatherName.trim() }),
          ...(dto.phone !== undefined && { phone: dto.phone.trim() }),
          ...(dto.city !== undefined && { city: dto.city.trim() }),
          ...(dto.address !== undefined && { address: dto.address.trim() || null }),
          ...(dto.loftName !== undefined && { loftName: dto.loftName.trim() }),
        },
      });

      return this.mapParticipant(participant);
    } catch (error) {
      this.handleUniqueViolation(error);
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    const participant = await this.prisma.participant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return this.mapParticipant(participant);
  }

  async uploadProfileImage(id: string, file: Express.Multer.File) {
    const existing = await this.findOne(id);
    const profileImage = await this.storage.saveParticipantProfile(file);

    if (existing.profileImage) {
      await this.storage.deleteByUrl(existing.profileImage);
    }

    const participant = await this.prisma.participant.update({
      where: { id },
      data: { profileImage },
    });

    return this.mapParticipant(participant);
  }

  async listCities() {
    const rows = await this.prisma.participant.findMany({
      where: { deletedAt: null },
      distinct: ['city'],
      select: { city: true },
      orderBy: { city: 'asc' },
    });

    return rows.map((row) => row.city);
  }

  private async assertUniquePhone(tournamentId: string, phone: string, excludeId?: string) {
    const existing = await this.prisma.participant.findFirst({
      where: {
        tournamentId,
        phone,
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    });

    if (existing) {
      throw new ConflictException(
        'A participant with this phone number is already registered in this tournament',
      );
    }
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

  private buildOrderBy(
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Prisma.ParticipantOrderByWithRelationInput {
    const direction = sortOrder === 'asc' ? 'asc' : 'desc';
    if (sortBy && SORTABLE_FIELDS.has(sortBy)) {
      return { [sortBy]: direction };
    }
    return { createdAt: 'desc' };
  }

  private mapParticipant(participant: Participant) {
    return {
      id: participant.id,
      tournamentId: participant.tournamentId,
      name: participant.name,
      fatherName: participant.fatherName,
      phone: participant.phone,
      city: participant.city,
      address: participant.address,
      loftName: participant.loftName,
      profileImage: participant.profileImage,
      createdAt: participant.createdAt.toISOString(),
      updatedAt: participant.updatedAt.toISOString(),
    };
  }
}
