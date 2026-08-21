import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportResultScope, ReportType } from '@kabootar/shared';
import { of, throwError } from 'rxjs';

import { RegistrationService } from '../registrations/registration.service';
import { RaceDayService } from '../tournaments/race-day.service';
import { TournamentService } from '../tournaments/tournament.service';
import { ReportService } from './report.service';
import { ReportsComponent } from './reports.component';

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;
  let reportService: jasmine.SpyObj<ReportService>;

  beforeEach(async () => {
    reportService = jasmine.createSpyObj('ReportService', [
      'downloadTournamentResult',
      'downloadParticipantList',
      'downloadPaymentReport',
      'downloadPrizeReport',
      'downloadLandingTimeReport',
    ]);

    await TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [
        {
          provide: TournamentService,
          useValue: {
            list: jasmine
              .createSpy('list')
              .and.returnValue(
                of({
                  items: [{ id: 't1', title: 'Spring Cup', city: 'Lahore' }],
                  total: 1,
                  page: 1,
                  limit: 100,
                  totalPages: 1,
                }),
              ),
          },
        },
        {
          provide: RaceDayService,
          useValue: {
            listByTournament: jasmine
              .createSpy('listByTournament')
              .and.returnValue(of([{ id: 'rd1', raceDate: '2026-04-01', releaseTime: '06:30' }])),
          },
        },
        {
          provide: RegistrationService,
          useValue: {
            list: jasmine.createSpy('list').and.returnValue(
              of({
                items: [
                  {
                    id: 'reg1',
                    participantId: 'p1',
                    participant: { id: 'p1', name: 'Ali', loftName: 'Sky Loft' },
                  },
                ],
                total: 1,
                page: 1,
                limit: 100,
                totalPages: 1,
              }),
            ),
          },
        },
        { provide: ReportService, useValue: reportService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads tournaments on init', () => {
    expect(component.tournaments().length).toBe(1);
  });

  it('downloads participant list when tournament is selected', () => {
    reportService.downloadParticipantList.and.returnValue(of(new Blob(['test'])));

    component.onTournamentChange('t1');
    component.downloadReport(ReportType.PARTICIPANT_LIST);

    expect(reportService.downloadParticipantList).toHaveBeenCalledWith('t1');
  });

  it('downloads complete tournament PDF when tournament is selected', () => {
    reportService.downloadTournamentResult.and.returnValue(of(new Blob(['test'])));

    component.onTournamentChange('t1');
    component.downloadReport(ReportType.TOURNAMENT_RESULT, ReportResultScope.COMPLETE);

    expect(reportService.downloadTournamentResult).toHaveBeenCalledWith(
      't1',
      ReportResultScope.COMPLETE,
      undefined,
      undefined,
    );
  });

  it('downloads an overall participant PDF when a participant is selected', () => {
    reportService.downloadTournamentResult.and.returnValue(of(new Blob(['test'])));

    component.onTournamentChange('t1');
    component.onScopeChange(ReportResultScope.PARTICIPANT);
    component.onParticipantChange('p1');
    component.downloadReport(ReportType.TOURNAMENT_RESULT);

    expect(reportService.downloadTournamentResult).toHaveBeenCalledWith(
      't1',
      ReportResultScope.PARTICIPANT,
      undefined,
      'p1',
    );
  });

  it('shows error when daily result is requested without race day', () => {
    component.onTournamentChange('t1');
    component.onScopeChange(ReportResultScope.DAILY);
    component.downloadReport(ReportType.TOURNAMENT_RESULT);

    expect(component.errorMessage()).toContain('Select a race day');
    expect(reportService.downloadTournamentResult).not.toHaveBeenCalled();
  });

  it('clears loading state when download fails', () => {
    reportService.downloadPrizeReport.and.returnValue(throwError(() => new Error('failed')));

    component.onTournamentChange('t1');
    component.downloadReport(ReportType.PRIZES);

    expect(component.downloading()).toBeNull();
    expect(component.errorMessage()).toBeTruthy();
  });
});
