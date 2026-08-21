import { Injectable } from '@angular/core';
import { OrganizerUnlockResponse, TournamentDetailDto } from '@kabootar/shared';

const STORAGE_KEY = 'organizerSession';

interface OrganizerSession {
  token: string;
  accessToken: string;
  expiresAt: string;
  tournament: TournamentDetailDto;
}

@Injectable({ providedIn: 'root' })
export class OrganizerSessionService {
  private session: OrganizerSession | null = this.load();

  store(token: string, response: OrganizerUnlockResponse): void {
    this.session = {
      token,
      accessToken: response.accessToken,
      expiresAt: response.expiresAt,
      tournament: response.tournament,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
  }

  clear(): void {
    this.session = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  getAccessToken(): string | null {
    if (!this.hasValidSession()) {
      return null;
    }
    return this.session?.accessToken ?? null;
  }

  getToken(): string | null {
    return this.hasValidSession() ? this.session?.token ?? null : null;
  }

  getTournament(): TournamentDetailDto | null {
    return this.hasValidSession() ? this.session?.tournament ?? null : null;
  }

  getExpiresAt(): string | null {
    return this.hasValidSession() ? this.session?.expiresAt ?? null : null;
  }

  hasValidSession(token?: string): boolean {
    if (!this.session) {
      return false;
    }

    if (token && this.session.token !== token) {
      return false;
    }

    if (new Date(this.session.expiresAt).getTime() <= Date.now()) {
      this.clear();
      return false;
    }

    return true;
  }

  private load(): OrganizerSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as OrganizerSession;
      if (!parsed.accessToken || !parsed.token || !parsed.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
}
