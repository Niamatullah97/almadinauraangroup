import { TestBed } from '@angular/core/testing';
import { OrganizerUnlockResponse, TournamentStatus } from '@kabootar/shared';

import { OrganizerSessionService } from './organizer-session.service';

describe('OrganizerSessionService', () => {
  let service: OrganizerSessionService;

  const response: OrganizerUnlockResponse = {
    accessToken: 'jwt-token',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    token: 'link-token',
    tournament: {
      id: 'tournament-1',
      title: 'Classic',
      slug: 'classic',
      description: null,
      city: 'Lahore',
      entryFee: 500,
      totalPigeonsAllowed: 100,
      doubleStampEnabled: false,
      startDate: '2026-04-01',
      endDate: '2026-04-05',
      startTime: '08:00',
      endTime: '18:00',
      status: TournamentStatus.ACTIVE,
      bannerImage: null,
      createdBy: 'admin-1',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrganizerSessionService);
    service.clear();
  });

  it('stores and restores an organizer session', () => {
    service.store('link-token', response);
    expect(service.hasValidSession('link-token')).toBeTrue();
    expect(service.getAccessToken()).toBe('jwt-token');
    expect(service.getTournament()?.title).toBe('Classic');
  });

  it('rejects a session for a different link token', () => {
    service.store('link-token', response);
    expect(service.hasValidSession('other-token')).toBeFalse();
  });

  it('clears an expired session', () => {
    service.store('link-token', {
      ...response,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    expect(service.hasValidSession('link-token')).toBeFalse();
    expect(localStorage.getItem('organizerSession')).toBeNull();
  });
});
