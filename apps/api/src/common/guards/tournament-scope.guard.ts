import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { isOrganizerToken } from '@kabootar/shared';

const TOURNAMENT_ID_PATTERN = /\/tournaments\/([0-9a-f-]{36})/i;

@Injectable()
export class TournamentScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { tournamentId?: string; role?: string; tokenType?: string };
      params?: Record<string, string>;
      originalUrl?: string;
      url?: string;
    }>();

    const user = request.user;
    if (!user || !isOrganizerToken(user)) {
      return true;
    }

    if (!user.tournamentId) {
      throw new ForbiddenException('Organizer access is not scoped to a tournament');
    }

    const requestedTournamentId = this.extractTournamentId(request);
    if (!requestedTournamentId) {
      return true;
    }

    if (requestedTournamentId !== user.tournamentId) {
      throw new ForbiddenException('Organizer access is limited to the assigned tournament');
    }

    return true;
  }

  private extractTournamentId(request: {
    params?: Record<string, string>;
    originalUrl?: string;
    url?: string;
  }): string | undefined {
    if (request.params?.tournamentId) {
      return request.params.tournamentId;
    }

    const url = request.originalUrl ?? request.url ?? '';
    return url.match(TOURNAMENT_ID_PATTERN)?.[1];
  }
}
