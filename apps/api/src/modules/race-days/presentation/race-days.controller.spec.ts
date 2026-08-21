import { Test, TestingModule } from '@nestjs/testing';

import { RaceDaysService } from '../application/race-days.service';
import { RaceDaysController } from './race-days.controller';

describe('RaceDaysController', () => {
  let controller: RaceDaysController;
  let raceDaysService: {
    findAllByTournament: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    raceDaysService = {
      findAllByTournament: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RaceDaysController],
      providers: [{ provide: RaceDaysService, useValue: raceDaysService }],
    }).compile();

    controller = module.get<RaceDaysController>(RaceDaysController);
  });

  it('delegates list requests to the service', async () => {
    raceDaysService.findAllByTournament.mockResolvedValue([]);

    await controller.findAll('tournament-1');

    expect(raceDaysService.findAllByTournament).toHaveBeenCalledWith('tournament-1');
  });

  it('delegates create requests to the service', async () => {
    const dto = {
      raceDate: '2026-04-02',
      releaseTime: '06:30',
      endTime: '18:00',
      releaseLocation: 'Central Loft',
    };
    raceDaysService.create.mockResolvedValue({ id: 'race-day-1', ...dto });

    const result = await controller.create('tournament-1', dto);

    expect(raceDaysService.create).toHaveBeenCalledWith('tournament-1', dto);
    expect(result.id).toBe('race-day-1');
  });
});
