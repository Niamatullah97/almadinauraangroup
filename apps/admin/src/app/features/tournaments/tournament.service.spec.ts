import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TournamentStatus } from '@kabootar/shared';

import { TournamentService } from './tournament.service';
import { ApiService } from '../../core/services/api.service';

describe('TournamentService', () => {
  let service: TournamentService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post', 'patch', 'delete', 'upload']);

    TestBed.configureTestingModule({
      providers: [TournamentService, { provide: ApiService, useValue: api }],
    });

    service = TestBed.inject(TournamentService);
  });

  it('loads tournaments with query params', () => {
    api.get.and.returnValue(
      of({
        success: true,
        message: 'OK',
        data: { items: [], total: 0, page: 1, limit: 10, totalPages: 0 },
      }),
    );

    service.list({ page: 1, limit: 10, status: TournamentStatus.ACTIVE }).subscribe((result) => {
      expect(result.total).toBe(0);
    });

    expect(api.get).toHaveBeenCalled();
  });

  it('creates a tournament', () => {
    api.post.and.returnValue(
      of({
        success: true,
        message: 'OK',
        data: { id: '1', title: 'Classic' },
      }),
    );

    service
      .create({
        title: 'Classic',
        city: 'Lahore',
        entryFee: 500,
        totalPigeonsAllowed: 100,
        startDate: '2026-04-01',
        endDate: '2026-04-02',
        startTime: '08:00',
        endTime: '18:00',
      })
      .subscribe((result) => {
        expect(result.id).toBe('1');
      });
  });

  it('handles delete errors', () => {
    api.delete.and.returnValue(throwError(() => new Error('fail')));

    service.delete('1').subscribe({
      error: (error) => expect(error).toBeTruthy(),
    });
  });
});
