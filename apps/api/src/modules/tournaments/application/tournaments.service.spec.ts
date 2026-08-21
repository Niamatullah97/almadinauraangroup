import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TournamentStatus } from '@prisma/client';

import { TournamentsService } from './tournaments.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.module';
import { StorageService } from '../../../infrastructure/storage/storage.service';

describe('TournamentsService', () => {
  let service: TournamentsService;
  let prisma: {
    tournament: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let storage: { saveTournamentBanner: jest.Mock; deleteByUrl: jest.Mock };

  const tournamentRecord = {
    id: 'tournament-1',
    title: 'Spring Classic',
    slug: 'spring-classic',
    description: 'Annual race',
    city: 'Lahore',
    entryFee: { toString: () => '500' },
    totalPigeonsAllowed: 100,
    doubleStampEnabled: false,
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-04-03'),
    startTime: '08:00',
    endTime: '18:00',
    status: TournamentStatus.DRAFT,
    bannerImage: null,
    createdById: 'user-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    deletedAt: null,
  };

  beforeEach(() => {
    prisma = {
      tournament: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    storage = {
      saveTournamentBanner: jest.fn(),
      deleteByUrl: jest.fn(),
    };

    service = new TournamentsService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
    );
  });

  describe('create', () => {
    it('creates a tournament with a generated slug', async () => {
      prisma.tournament.findFirst.mockResolvedValue(null);
      prisma.tournament.create.mockResolvedValue({
        ...tournamentRecord,
        createdBy: {
          id: 'user-1',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@test.com',
        },
      });

      const result = await service.create('user-1', {
        title: 'Spring Classic',
        city: 'Lahore',
        entryFee: 500,
        totalPigeonsAllowed: 100,
        startDate: '2026-04-01',
        endDate: '2026-04-03',
        startTime: '08:00',
        endTime: '18:00',
      });

      expect(prisma.tournament.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'spring-classic',
            createdById: 'user-1',
          }),
        }),
      );
      expect(result.slug).toBe('spring-classic');
      expect(result.entryFee).toBe(500);
    });
  });

  describe('findAll', () => {
    it('returns paginated tournaments with status filter', async () => {
      prisma.tournament.findMany.mockResolvedValue([tournamentRecord]);
      prisma.tournament.count.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        status: TournamentStatus.DRAFT,
        search: 'spring',
      });

      expect(prisma.tournament.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: TournamentStatus.DRAFT,
          }),
        }),
      );
      expect(result.total).toBe(1);
      expect(result.items[0].title).toBe('Spring Classic');
    });
  });

  describe('findOne', () => {
    it('throws when tournament is missing', async () => {
      prisma.tournament.findFirst.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('rejects end dates before start dates', async () => {
      prisma.tournament.findFirst.mockResolvedValue({
        ...tournamentRecord,
        createdBy: { id: 'user-1', firstName: 'A', lastName: 'B', email: 'a@b.com' },
        _count: { entries: 0 },
      });

      await expect(
        service.update('tournament-1', {
          startDate: '2026-04-05',
          endDate: '2026-04-01',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('uploadBanner', () => {
    it('stores a new banner and removes the previous one', async () => {
      prisma.tournament.findFirst.mockResolvedValue({
        ...tournamentRecord,
        bannerImage: '/uploads/tournaments/old.jpg',
        createdBy: { id: 'user-1', firstName: 'A', lastName: 'B', email: 'a@b.com' },
        _count: { entries: 0 },
      });
      storage.saveTournamentBanner.mockResolvedValue('/uploads/tournaments/new.jpg');
      prisma.tournament.update.mockResolvedValue({
        ...tournamentRecord,
        bannerImage: '/uploads/tournaments/new.jpg',
      });

      const file = {
        originalname: 'banner.jpg',
        mimetype: 'image/jpeg',
        size: 1000,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const result = await service.uploadBanner('tournament-1', file);

      expect(storage.deleteByUrl).toHaveBeenCalledWith('/uploads/tournaments/old.jpg');
      expect(result.bannerImage).toBe('/uploads/tournaments/new.jpg');
    });
  });
});
