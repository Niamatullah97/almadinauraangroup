import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PigeonSex, PigeonStatus } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.module';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreatePigeonDto } from '../presentation/dto/create-pigeon.dto';
import { UpdatePigeonDto } from '../presentation/dto/update-pigeon.dto';

@Injectable()
export class PigeonsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreatePigeonDto) {
    return this.prisma.pigeon.create({
      data: { ...dto, ownerId },
    });
  }

  async findAll(query: PaginationQueryDto, ownerId?: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(ownerId && { ownerId }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { ringNumber: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.pigeon.findMany({ skip, take: limit, where, orderBy: { createdAt: 'desc' } }),
      this.prisma.pigeon.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const pigeon = await this.prisma.pigeon.findFirst({
      where: { id, deletedAt: null },
    });
    if (!pigeon) throw new NotFoundException('Pigeon not found');
    return pigeon;
  }

  async update(id: string, userId: string, dto: UpdatePigeonDto) {
    const pigeon = await this.findOne(id);
    if (pigeon.ownerId !== userId) throw new ForbiddenException('Not your pigeon');

    return this.prisma.pigeon.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string) {
    const pigeon = await this.findOne(id);
    if (pigeon.ownerId !== userId) throw new ForbiddenException('Not your pigeon');

    return this.prisma.pigeon.update({
      where: { id },
      data: { deletedAt: new Date(), status: PigeonStatus.RETIRED },
    });
  }
}
