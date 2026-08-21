import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthTokenType, UserRole } from '@kabootar/shared';

import { AdminAccessGuard } from './admin-access.guard';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';

describe('AdminAccessGuard', () => {
  let guard: AdminAccessGuard;
  let reflector: Reflector;

  const createContext = (user?: object) =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AdminAccessGuard(reflector);
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      return undefined;
    });
  });

  it('allows public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows Super Admin', () => {
    expect(guard.canActivate(createContext({ role: UserRole.SUPER_ADMIN }))).toBe(true);
  });

  it('allows organizer tokens', () => {
    expect(
      guard.canActivate(
        createContext({ role: UserRole.ORGANIZER, tokenType: AuthTokenType.ORGANIZER }),
      ),
    ).toBe(true);
  });

  it('blocks other roles from the admin dashboard', () => {
    expect(() =>
      guard.canActivate(createContext({ role: UserRole.CLUB_ADMIN })),
    ).toThrow(ForbiddenException);
  });
});
