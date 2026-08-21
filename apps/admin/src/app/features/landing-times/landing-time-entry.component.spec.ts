import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RaceDayStatus } from '@kabootar/shared';
import { of } from 'rxjs';

import { ParticipantService } from '../participants/participant.service';
import { RaceDayService } from '../tournaments/race-day.service';
import { TournamentService } from '../tournaments/tournament.service';
import { LandingTimeEntryComponent } from './landing-time-entry.component';
import { LandingTimeService } from './landing-time.service';

describe('LandingTimeEntryComponent', () => {
  let fixture: ComponentFixture<LandingTimeEntryComponent>;

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 3, 1, 12, 0, 0));

    await TestBed.configureTestingModule({
      imports: [LandingTimeEntryComponent],
      providers: [
        {
          provide: TournamentService,
          useValue: {
            list: jasmine.createSpy('list').and.returnValue(
              of({
                items: [{ id: 'tournament-1', title: 'Classic', city: 'Lahore' }],
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
            listByTournament: jasmine.createSpy('listByTournament').and.returnValue(
              of([
                {
                  id: 'race-day-1',
                  tournamentId: 'tournament-1',
                  raceDate: '2026-04-01',
                  releaseTime: '06:30',
                  releaseLocation: 'Lahore',
                  weatherNotes: null,
                  status: RaceDayStatus.LIVE,
                  createdAt: '2026-01-01',
                  updatedAt: '2026-01-01',
                },
              ]),
            ),
          },
        },
        {
          provide: LandingTimeService,
          useValue: {
            getEntrySheet: jasmine.createSpy('getEntrySheet').and.returnValue(
              of({
                tournamentId: 'tournament-1',
                raceDayId: 'race-day-1',
                raceDate: '2026-04-01',
                releaseTime: '06:30',
                endTime: '18:00',
                status: RaceDayStatus.LIVE,
                doubleStampEnabled: false,
                pigeonCount: 1,
                participants: [
                  {
                    participantId: 'participant-1',
                    participantName: 'Ahmed Khan',
                    loftName: 'Sky Loft',
                    profileImage: null,
                    pigeons: [
                      {
                        registrationPigeonId: 'pigeon-1',
                        pigeonNumber: 1,
                        ringNumber: 'PK-001',
                        landingTimeId: null,
                        landingTime: null,
                        isDoubleStamp: false,
                      },
                    ],
                  },
                ],
              }),
            ),
            bulkSave: jasmine
              .createSpy('bulkSave')
              .and.returnValue(of({ saved: [], skipped: 0, errors: [] })),
          },
        },
        {
          provide: ParticipantService,
          useValue: {
            resolveProfileUrl: () => null,
            getInitials: () => 'AK',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingTimeEntryComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load tournaments on init', () => {
    expect(fixture.componentInstance.tournaments().length).toBe(1);
  });

  it('should enable save when rows have landing times', () => {
    fixture.componentInstance.onTournamentChange('tournament-1');
    fixture.componentInstance.onRaceDayChange('race-day-1');
    fixture.detectChanges();

    expect(fixture.componentInstance.participantRows().length).toBe(1);
    fixture.componentInstance.participantRows()[0].cells[0]!.landingTime = '14:35:22';
    fixture.detectChanges();
    expect(fixture.componentInstance.canSave()).toBeTrue();
    expect(fixture.nativeElement.querySelector('.landing-entry__time-input')).toBeTruthy();
    expect(
      fixture.componentInstance.cellFlightTime(
        fixture.componentInstance.participantRows()[0].cells[0]!,
      ),
    ).toBe('08:05:22');
    expect(fixture.componentInstance.rowTotal(fixture.componentInstance.participantRows()[0])).toBe(
      '08:05:22',
    );
  });

  it('should disable entry after the race-day end time', () => {
    fixture.componentInstance.onTournamentChange('tournament-1');
    fixture.componentInstance.onRaceDayChange('race-day-1');
    jasmine.clock().mockDate(new Date(2026, 3, 1, 18, 0, 1));
    jasmine.clock().tick(1000);

    expect(fixture.componentInstance.canEnterTimes()).toBeFalse();
  });
});
