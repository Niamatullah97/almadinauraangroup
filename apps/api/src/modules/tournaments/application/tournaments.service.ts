import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Tournament, TournamentStatus } from '@prisma/client';

import { slugify } from '../../../common/utils/slug.util';
import { PrismaService } from '../../../infrastructure/prisma/prisma.module';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { CreateTournamentDto } from '../presentation/dto/create-tournament.dto';
import { TournamentQueryDto } from '../presentation/dto/tournament-query.dto';
import { UpdateTournamentDto } from '../presentation/dto/update-tournament.dto';

type TournamentWithCreator = Tournament & {
  createdBy?: { id: string; firstName: string; lastName: string; email: string };
  _count?: { registrations: number };
};

const SORTABLE_FIELDS = new Set(['title', 'city', 'startDate', 'endDate', 'status', 'createdAt']);

@Injectable()
export class TournamentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(createdById: string, dto: CreateTournamentDto) {
    const slug = await this.generateUniqueSlug(dto.title);

    const tournament = await this.prisma.tournament.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        city: dto.city,
        entryFee: dto.entryFee,
        totalPigeonsAllowed: dto.totalPigeonsAllowed,
        doubleStampEnabled: dto.doubleStampEnabled ?? false,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        status: dto.status ?? TournamentStatus.DRAFT,
        createdById,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return this.mapTournament(tournament);
  }

  async findAll(query: TournamentQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TournamentWhereInput = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { city: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy = this.buildOrderBy(query.sortBy, query.sortOrder);

    const [items, total] = await Promise.all([
      this.prisma.tournament.findMany({
        skip,
        take: limit,
        where,
        orderBy,
      }),
      this.prisma.tournament.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapTournament(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const tournament = await this.prisma.tournament.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { registrations: { where: { deletedAt: null } } } },
      },
    });

    if (!tournament) throw new NotFoundException('Tournament not found');
    return this.mapTournamentDetail(tournament);
  }

  async findBySlug(slug: string) {
    const tournament = await this.prisma.tournament.findFirst({
      where: { slug, deletedAt: null },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { registrations: { where: { deletedAt: null } } } },
      },
    });

    if (!tournament) throw new NotFoundException('Tournament not found');
    return this.mapTournamentDetail(tournament);
  }

  async update(id: string, dto: UpdateTournamentDto) {
    const existing = await this.findOne(id);

    if (dto.startDate && dto.endDate) {
      if (new Date(dto.endDate) < new Date(dto.startDate)) {
        throw new BadRequestException('End date must be on or after start date');
      }
    } else if (dto.endDate && new Date(dto.endDate) < new Date(existing.startDate)) {
      throw new BadRequestException('End date must be on or after start date');
    } else if (dto.startDate && new Date(existing.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('End date must be on or after start date');
    }

    const startTime = dto.startTime ?? existing.startTime;
    const endTime = dto.endTime ?? existing.endTime;
    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const tournament = await this.prisma.tournament.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.title !== undefined && { slug: await this.generateUniqueSlug(dto.title, id) }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.entryFee !== undefined && { entryFee: dto.entryFee }),
        ...(dto.totalPigeonsAllowed !== undefined && {
          totalPigeonsAllowed: dto.totalPigeonsAllowed,
        }),
        ...(dto.doubleStampEnabled !== undefined && {
          doubleStampEnabled: dto.doubleStampEnabled,
        }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.startTime !== undefined && { startTime: dto.startTime }),
        ...(dto.endTime !== undefined && { endTime: dto.endTime }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { registrations: { where: { deletedAt: null } } } },
      },
    });

    return this.mapTournamentDetail(tournament);
  }

  async remove(id: string) {
    await this.findOne(id);

    const tournament = await this.prisma.tournament.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: TournamentStatus.CANCELLED,
      },
    });

    return this.mapTournament(tournament);
  }

  async uploadBanner(id: string, file: Express.Multer.File) {
    const existing = await this.findOne(id);
    const bannerImage = await this.storage.saveTournamentBanner(file);

    if (existing.bannerImage) {
      await this.storage.deleteByUrl(existing.bannerImage);
    }

    const tournament = await this.prisma.tournament.update({
      where: { id },
      data: { bannerImage },
    });

    return this.mapTournament(tournament);
  }

  private async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    const base = slugify(title) || 'tournament';
    let slug = base;
    let counter = 1;

    while (true) {
      // Include soft-deleted rows — DB unique index is on `slug` alone.
      const existing = await this.prisma.tournament.findFirst({
        where: {
          slug,
          ...(excludeId && { NOT: { id: excludeId } }),
        },
      });

      if (!existing) return slug;
      slug = `${base}-${counter++}`;
    }
  }

  private buildOrderBy(
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Prisma.TournamentOrderByWithRelationInput {
    const direction = sortOrder === 'asc' ? 'asc' : 'desc';
    if (sortBy && SORTABLE_FIELDS.has(sortBy)) {
      return { [sortBy]: direction };
    }
    return { startDate: 'desc' };
  }

  private mapTournament(tournament: Tournament) {
    return {
      id: tournament.id,
      title: tournament.title,
      slug: tournament.slug,
      description: tournament.description,
      city: tournament.city,
      entryFee: Number(tournament.entryFee),
      totalPigeonsAllowed: tournament.totalPigeonsAllowed,
      doubleStampEnabled: tournament.doubleStampEnabled,
      startDate: tournament.startDate.toISOString().slice(0, 10),
      endDate: tournament.endDate.toISOString().slice(0, 10),
      startTime: tournament.startTime,
      endTime: tournament.endTime,
      status: tournament.status,
      bannerImage: tournament.bannerImage,
      createdBy: tournament.createdById,
      createdAt: tournament.createdAt.toISOString(),
      updatedAt: tournament.updatedAt.toISOString(),
    };
  }

  private mapTournamentDetail(tournament: TournamentWithCreator) {
    return {
      ...this.mapTournament(tournament),
      creator: tournament.createdBy,
      entryCount: tournament._count?.registrations ?? 0,
    };
  }
}
