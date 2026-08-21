import { NotFoundException } from '@nestjs/common';

import { UsersService } from './users.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.module';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: { findMany: jest.Mock; count: jest.Mock; findFirst: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    service = new UsersService(prisma as unknown as PrismaService);
  });

  it('returns paginated users', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'u1', email: 'admin@test.com' }]);
    prisma.user.count.mockResolvedValue(1);

    const result = await service.findAll({ page: 1, limit: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('throws when user is not found', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
