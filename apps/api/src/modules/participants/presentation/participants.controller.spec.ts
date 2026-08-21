import { Test, TestingModule } from '@nestjs/testing';

import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from '../application/participants.service';

describe('ParticipantsController', () => {
  let controller: ParticipantsController;
  let participantsService: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    uploadProfileImage: jest.Mock;
    listCities: jest.Mock;
  };

  beforeEach(async () => {
    participantsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      uploadProfileImage: jest.fn(),
      listCities: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParticipantsController],
      providers: [{ provide: ParticipantsService, useValue: participantsService }],
    }).compile();

    controller = module.get<ParticipantsController>(ParticipantsController);
  });

  it('delegates list queries to the service', async () => {
    participantsService.findAll.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await controller.findAll({ page: 1, limit: 20, search: 'Ahmed' });

    expect(participantsService.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      search: 'Ahmed',
    });
  });

  it('delegates profile upload to the service', async () => {
    const file = { originalname: 'profile.jpg' } as Express.Multer.File;
    participantsService.uploadProfileImage.mockResolvedValue({
      profileImage: '/uploads/participants/profile.jpg',
    });

    const result = await controller.uploadProfile('participant-1', file);

    expect(participantsService.uploadProfileImage).toHaveBeenCalledWith('participant-1', file);
    expect(result.profileImage).toContain('/uploads/participants/');
  });
});
