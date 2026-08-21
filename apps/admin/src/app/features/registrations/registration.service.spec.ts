import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { RegistrationService } from './registration.service';
import { ApiService } from '../../core/services/api.service';

describe('RegistrationService', () => {
  let service: RegistrationService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post', 'patch', 'delete']);
    TestBed.configureTestingModule({
      providers: [RegistrationService, { provide: ApiService, useValue: api }],
    });
    service = TestBed.inject(RegistrationService);
  });

  it('lists registrations with query params', (done) => {
    api.get.and.returnValue(
      of({
        success: true,
        message: 'OK',
        data: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      }),
    );

    service.list({ tournamentId: 'tournament-1' }).subscribe((response) => {
      expect(api.get).toHaveBeenCalledWith('/registrations', { tournamentId: 'tournament-1' });
      expect(response.total).toBe(0);
      done();
    });
  });

  it('previews fee for tournament', (done) => {
    api.get.and.returnValue(
      of({
        success: true,
        message: 'OK',
        data: {
          entryFeePerPigeon: 500,
          pigeonCount: 3,
          totalFee: 1500,
          remainingPigeonSlots: 7,
        },
      }),
    );

    service.previewFee('tournament-1', 3).subscribe((preview) => {
      expect(preview.totalFee).toBe(1500);
      done();
    });
  });
});
