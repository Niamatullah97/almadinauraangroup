import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, UserRole } from '@kabootar/shared';

import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/auth.decorators';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createContext = (user?: { role: UserRole }) =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows access when user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.CLUB_ADMIN]);

    expect(guard.canActivate(createContext({ role: UserRole.CLUB_ADMIN }))).toBe(true);
  });

  it('throws ForbiddenException when user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SUPER_ADMIN]);

    expect(() =>
      guard.canActivate(createContext({ role: UserRole.PARTICIPANT })),
    ).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user is not authenticated', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.CLUB_ADMIN]);

    expect(() => guard.canActivate(createContext())).toThrow(ForbiddenException);
  });
});

describe('RolesGuard metadata', () => {
  it('uses ROLES_KEY constant', () => {
    expect(ROLES_KEY).toBe('roles');
  });
});
