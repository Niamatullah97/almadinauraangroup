import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthTokenType, UserRole } from '@kabootar/shared';

import { TournamentScopeGuard } from './tournament-scope.guard';

describe('TournamentScopeGuard', () => {
  const guard = new TournamentScopeGuard();

  const createContext = (user?: object, params?: Record<string, string>, url = '') =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params, originalUrl: url, url }),
      }),
    }) as ExecutionContext;

  it('allows Super Admin without a tournament scope', () => {
    expect(guard.canActivate(createContext({ role: UserRole.SUPER_ADMIN }))).toBe(true);
  });

  it('allows organizer access to the assigned tournament', () => {
    expect(
      guard.canActivate(
        createContext(
          {
            role: UserRole.ORGANIZER,
            tokenType: AuthTokenType.ORGANIZER,
            tournamentId: '11111111-1111-1111-1111-111111111111',
          },
          { tournamentId: '11111111-1111-1111-1111-111111111111' },
        ),
      ),
    ).toBe(true);
  });

  it('blocks organizer access to another tournament', () => {
    expect(() =>
      guard.canActivate(
        createContext(
          {
            role: UserRole.ORGANIZER,
            tokenType: AuthTokenType.ORGANIZER,
            tournamentId: '11111111-1111-1111-1111-111111111111',
          },
          { tournamentId: '22222222-2222-2222-2222-222222222222' },
        ),
      ),
    ).toThrow(ForbiddenException);
  });
});
