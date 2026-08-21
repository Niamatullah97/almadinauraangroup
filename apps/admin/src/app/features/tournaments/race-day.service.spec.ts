import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { RaceDayService } from './race-day.service';

describe('RaceDayService', () => {
  let service: RaceDayService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post', 'patch', 'delete']);

    TestBed.configureTestingModule({
      providers: [RaceDayService, { provide: ApiService, useValue: api }],
    });

    service = TestBed.inject(RaceDayService);
  });

  it('loads race days for a tournament', () => {
    api.get.and.returnValue(
      of({
        success: true,
        message: 'OK',
        data: [{ id: '1', raceDate: '2026-04-02' }],
      }),
    );

    service.listByTournament('tournament-1').subscribe((items) => {
      expect(items.length).toBe(1);
    });
  });

  it('creates a race day', () => {
    api.post.and.returnValue(
      of({
        success: true,
        message: 'OK',
        data: { id: '1', raceDate: '2026-04-02' },
      }),
    );

    service
      .create('tournament-1', {
        raceDate: '2026-04-02',
        releaseTime: '06:30',
        endTime: '18:00',
        releaseLocation: 'Central Loft',
      })
      .subscribe((result) => {
        expect(result.id).toBe('1');
      });
  });

  it('handles delete errors', () => {
    api.delete.and.returnValue(throwError(() => new Error('fail')));

    service.delete('tournament-1', 'race-day-1').subscribe({
      error: (error) => expect(error).toBeTruthy(),
    });
  });
});
