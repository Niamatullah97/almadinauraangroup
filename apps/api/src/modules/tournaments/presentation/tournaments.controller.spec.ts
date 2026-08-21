import { Test, TestingModule } from '@nestjs/testing';
import { TournamentStatus } from '@prisma/client';
import { Permission, UserRole } from '@kabootar/shared';

import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from '../application/tournaments.service';

describe('TournamentsController', () => {
  let controller: TournamentsController;
  let tournamentsService: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    findBySlug: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    uploadBanner: jest.Mock;
  };

  beforeEach(async () => {
    tournamentsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      uploadBanner: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TournamentsController],
      providers: [{ provide: TournamentsService, useValue: tournamentsService }],
    }).compile();

    controller = module.get<TournamentsController>(TournamentsController);
  });

  it('delegates list queries to the service', async () => {
    tournamentsService.findAll.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 });

    await controller.findAll({ page: 1, limit: 20, status: TournamentStatus.ACTIVE });

    expect(tournamentsService.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      status: TournamentStatus.ACTIVE,
    });
  });

  it('delegates create to the service with the authenticated user', async () => {
    const dto = {
      title: 'Classic',
      city: 'Karachi',
      entryFee: 300,
      totalPigeonsAllowed: 50,
      startDate: '2026-05-01',
      endDate: '2026-05-02',
      startTime: '07:30',
      endTime: '18:00',
    };
    tournamentsService.create.mockResolvedValue({ id: '1', ...dto });

    const result = await controller.create(
      { sub: 'user-1', email: 'a@b.com', role: UserRole.SUPER_ADMIN, permissions: [Permission.TOURNAMENTS_CREATE] },
      dto,
    );

    expect(tournamentsService.create).toHaveBeenCalledWith('user-1', dto);
    expect(result.id).toBe('1');
  });

  it('delegates banner upload to the service', async () => {
    const file = { originalname: 'banner.png' } as Express.Multer.File;
    tournamentsService.uploadBanner.mockResolvedValue({ bannerImage: '/uploads/tournaments/banner.png' });

    const result = await controller.uploadBanner('tournament-1', file);

    expect(tournamentsService.uploadBanner).toHaveBeenCalledWith('tournament-1', file);
    expect(result.bannerImage).toContain('/uploads/tournaments/');
  });
});
