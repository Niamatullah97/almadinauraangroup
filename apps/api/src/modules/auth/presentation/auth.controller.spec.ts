import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@kabootar/shared';

import { AuthController } from './auth.controller';
import { AuthService } from '../application/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: jest.Mock;
    register: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
    logoutAll: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      register: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      logoutAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login flow', () => {
    it('delegates login to AuthService and returns result', async () => {
      const loginResult = {
        user: {
          id: '1',
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User',
          role: UserRole.SUPER_ADMIN,
          permissions: ['users:read'],
        },
        accessToken: 'access',
        refreshToken: 'refresh',
      };
      authService.login.mockResolvedValue(loginResult);

      const result = await controller.login({
        email: 'admin@test.com',
        password: 'SuperAdmin@123',
      });

      expect(authService.login).toHaveBeenCalledWith({
        email: 'admin@test.com',
        password: 'SuperAdmin@123',
      });
      expect(result).toEqual(loginResult);
    });
  });

  describe('refresh flow', () => {
    it('delegates refresh to AuthService', async () => {
      authService.refresh.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      const result = await controller.refresh({ refreshToken: 'old-refresh' });

      expect(authService.refresh).toHaveBeenCalledWith('old-refresh');
      expect(result.accessToken).toBe('new-access');
    });
  });

  describe('logout flow', () => {
    it('delegates logout to AuthService', async () => {
      authService.logout.mockResolvedValue(undefined);

      await controller.logout(
        { sub: 'user-1', email: 'a@b.com', role: UserRole.PARTICIPANT, permissions: [] },
        { refreshToken: 'token' },
      );

      expect(authService.logout).toHaveBeenCalledWith('token', 'user-1');
    });
  });
});
