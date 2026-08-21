import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, UserRole } from '@kabootar/shared';

import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  const createContext = (permissions?: string[]) =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: permissions
            ? { role: UserRole.CLUB_ADMIN, permissions }
            : undefined,
        }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('allows access when no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows access when user has all required permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.TOURNAMENTS_READ, Permission.TOURNAMENTS_CREATE]);

    expect(
      guard.canActivate(
        createContext([Permission.TOURNAMENTS_READ, Permission.TOURNAMENTS_CREATE]),
      ),
    ).toBe(true);
  });

  it('throws ForbiddenException when user lacks a required permission', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.TOURNAMENTS_CREATE]);

    expect(() =>
      guard.canActivate(createContext([Permission.TOURNAMENTS_READ])),
    ).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user has no permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.USERS_READ]);

    expect(() => guard.canActivate(createContext([]))).toThrow(ForbiddenException);
  });
});
