import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ReportResultScope } from '@kabootar/shared';
import { ApiService } from '../../core/services/api.service';
import { ReportService } from './report.service';

describe('ReportService', () => {
  let service: ReportService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['download']);
    api.download.and.returnValue(of(new Blob(['test'])));

    TestBed.configureTestingModule({
      providers: [ReportService, { provide: ApiService, useValue: api }],
    });

    service = TestBed.inject(ReportService);
  });

  it('requests complete tournament result PDF', () => {
    service.downloadTournamentResult('t1', ReportResultScope.COMPLETE).subscribe();

    expect(api.download).toHaveBeenCalledWith('/tournaments/t1/reports/tournament-result', {
      scope: ReportResultScope.COMPLETE,
      raceDayId: undefined,
    });
  });

  it('requests payment report download', () => {
    service.downloadPaymentReport('t1').subscribe();

    expect(api.download).toHaveBeenCalledWith('/tournaments/t1/reports/payments');
  });

  it('requests landing time report with race day filter', () => {
    service.downloadLandingTimeReport('t1', 'rd1').subscribe();

    expect(api.download).toHaveBeenCalledWith('/tournaments/t1/reports/landing-times', {
      raceDayId: 'rd1',
    });
  });
});
