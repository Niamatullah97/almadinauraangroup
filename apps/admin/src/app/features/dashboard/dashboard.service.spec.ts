import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { DashboardService } from './dashboard.service';
import { ApiService } from '../../core/services/api.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiService = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        { provide: ApiService, useValue: apiService },
      ],
    });

    service = TestBed.inject(DashboardService);
  });

  it('should load stats from API', () => {
    apiService.get.and.returnValue(
      of({
        success: true,
        message: 'OK',
        data: {
          totalTournaments: 10,
          activeTournaments: 2,
          totalParticipants: 50,
          totalPigeons: 80,
          totalEntryFees: 10000,
          totalPrizePool: 25000,
        },
      }),
    );

    service.loadStats();

    expect(service.loading()).toBeFalse();
    expect(service.stats().totalTournaments).toBe(10);
    expect(service.stats().totalParticipants).toBe(50);
  });

  it('should show empty stats when the API fails', () => {
    apiService.get.and.returnValue(throwError(() => new Error('Network error')));

    service.loadStats();

    expect(service.loading()).toBeFalse();
    expect(service.error()).toBe('Unable to load dashboard stats.');
    expect(service.stats()).toEqual({
      totalTournaments: 0,
      activeTournaments: 0,
      totalParticipants: 0,
      totalPigeons: 0,
      totalEntryFees: 0,
      totalPrizePool: 0,
    });
  });
});
