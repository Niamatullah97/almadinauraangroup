import { ConflictException, NotFoundException } from '@nestjs/common';

import { ParticipantsService } from './participants.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.module';
import { StorageService } from '../../../infrastructure/storage/storage.service';

describe('ParticipantsService', () => {
  let service: ParticipantsService;
  let prisma: {
    participant: {
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let storage: { saveParticipantProfile: jest.Mock; deleteByUrl: jest.Mock };

  const participant = {
    id: 'participant-1',
    name: 'Ahmed Khan',
    fatherName: 'Muhammad Khan',
    phone: '+923001234567',
    city: 'Lahore',
    address: 'Model Town',
    loftName: 'Sky Loft',
    profileImage: null,
    tournamentId: 'tournament-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
  };

  beforeEach(() => {
    prisma = {
      participant: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    storage = {
      saveParticipantProfile: jest.fn(),
      deleteByUrl: jest.fn(),
    };

    service = new ParticipantsService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
    );
  });

  it('returns paginated participants with search', async () => {
    prisma.participant.findMany.mockResolvedValue([participant]);
    prisma.participant.count.mockResolvedValue(1);

    const result = await service.findAll({ page: 1, limit: 10, search: 'Ahmed' });

    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe('Ahmed Khan');
  });

  it('creates a participant', async () => {
    prisma.participant.findFirst.mockResolvedValue(null);
    prisma.participant.create.mockResolvedValue(participant);

    const result = await service.create({
      tournamentId: 'tournament-1',
      name: 'Ahmed Khan',
      fatherName: 'Muhammad Khan',
      phone: '+923001234567',
      city: 'Lahore',
      loftName: 'Sky Loft',
    });

    expect(result.loftName).toBe('Sky Loft');
  });

  it('rejects duplicate phone numbers', async () => {
    prisma.participant.findFirst.mockResolvedValue(participant);

    await expect(
      service.create({
        tournamentId: 'tournament-1',
        name: 'Other',
        fatherName: 'Other',
        phone: '+923001234567',
        city: 'Lahore',
        loftName: 'Loft',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when participant is missing', async () => {
    prisma.participant.findFirst.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('uploads profile image and removes previous one', async () => {
    prisma.participant.findFirst.mockResolvedValue({
      ...participant,
      profileImage: '/uploads/participants/old.jpg',
    });
    storage.saveParticipantProfile.mockResolvedValue('/uploads/participants/new.jpg');
    prisma.participant.update.mockResolvedValue({
      ...participant,
      profileImage: '/uploads/participants/new.jpg',
    });

    const file = {
      originalname: 'profile.jpg',
      mimetype: 'image/jpeg',
      size: 1000,
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    const result = await service.uploadProfileImage('participant-1', file);

    expect(storage.deleteByUrl).toHaveBeenCalledWith('/uploads/participants/old.jpg');
    expect(result.profileImage).toBe('/uploads/participants/new.jpg');
  });
});
