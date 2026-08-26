import { Permission, UserRole } from '@kabootar/shared';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserStatus } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.module';

import { AuthService } from './auth.service';

const mockUser = {
  id: 'user-1',
  email: 'test@test.com',
  passwordHash: 'hashed-password',
  firstName: 'Test',
  lastName: 'User',
  status: UserStatus.ACTIVE,
  role: {
    slug: UserRole.PARTICIPANT,
    permissions: [
      { permission: { slug: Permission.TOURNAMENTS_READ } },
      { permission: { slug: Permission.PIGEONS_READ } },
    ],
  },
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock };
    role: { findUnique: jest.Mock };
    refreshToken: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
      role: { findUnique: jest.fn() },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    jwtService = { sign: jest.fn().mockReturnValue('access-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'JWT_ACCESS_EXPIRY') return '15m';
              if (key === 'JWT_REFRESH_EXPIRY') return '7d';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('throws UnauthorizedException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'test@test.com', password: 'password' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when password is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when user is suspended', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        status: UserStatus.SUSPENDED,
      });

      await expect(service.login({ email: 'test@test.com', password: 'password' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns user and tokens on successful login', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(true);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({ email: 'test@test.com', password: 'password' });

      expect(result.user.email).toBe('test@test.com');
      expect(result.user.role).toBe(UserRole.PARTICIPANT);
      expect(result.user.permissions).toContain(Permission.TOURNAMENTS_READ);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBeDefined();
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-1',
          role: UserRole.PARTICIPANT,
          permissions: expect.arrayContaining([Permission.TOURNAMENTS_READ]),
        }),
        expect.any(Object),
      );
    });
  });

  describe('register', () => {
    it('throws ConflictException when email exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          email: 'test@test.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates participant user with tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findUnique.mockResolvedValue({ id: 'role-1', slug: UserRole.PARTICIPANT });
      (hash as jest.Mock).mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.register({
        email: 'test@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.user.role).toBe(UserRole.PARTICIPANT);
      expect(result.accessToken).toBeDefined();
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ roleId: 'role-1' }),
        }),
      );
    });
  });

  describe('refresh', () => {
    it('throws UnauthorizedException for invalid refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rotates refresh token and returns new token pair', async () => {
      const refreshToken = 'valid-refresh-token';
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: mockUser,
      });
      prisma.refreshToken.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh(refreshToken);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBeDefined();
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          tokenHash: expect.any(String),
        }),
      });
    });
  });

  describe('logout', () => {
    it('revokes refresh token for matching user', async () => {
      const refreshToken = 'token-to-revoke';
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
      });
      prisma.refreshToken.update.mockResolvedValue({});

      await service.logout(refreshToken, 'user-1');

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('throws UnauthorizedException when token belongs to another user', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'other-user',
      });

      await expect(service.logout('token', 'user-1')).rejects.toThrow(UnauthorizedException);
    });
  });
});
