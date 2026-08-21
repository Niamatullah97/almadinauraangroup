import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { LandingTimeService } from './landing-time.service';
import { ApiService } from '../../core/services/api.service';

describe('LandingTimeService', () => {
  let service: LandingTimeService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post', 'patch']);
    TestBed.configureTestingModule({
      providers: [LandingTimeService, { provide: ApiService, useValue: api }],
    });
    service = TestBed.inject(LandingTimeService);
  });

  it('loads entry sheet', (done) => {
    api.get.and.returnValue(
      of({
        success: true,
        message: 'OK',
        data: {
          tournamentId: 'tournament-1',
          raceDayId: 'race-day-1',
          raceDate: '2026-04-01',
          releaseTime: '06:30',
          status: 'LIVE',
          participants: [],
        },
      }),
    );

    service.getEntrySheet('tournament-1', 'race-day-1').subscribe((sheet) => {
      expect(sheet.participants).toEqual([]);
      done();
    });
  });

  it('bulk saves landing times', (done) => {
    api.post.and.returnValue(
      of({
        success: true,
        message: 'OK',
        data: { saved: [], skipped: 0, errors: [] },
      }),
    );

    service
      .bulkSave('tournament-1', 'race-day-1', {
        entries: [
          {
            participantId: 'participant-1',
            registrationPigeonId: 'pigeon-1',
            landingTime: '14:35:22',
          },
        ],
      })
      .subscribe((response) => {
        expect(response.errors).toEqual([]);
        done();
      });
  });
});
