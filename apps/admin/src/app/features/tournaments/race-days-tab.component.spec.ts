import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TournamentStatus } from '@kabootar/shared';
import { of } from 'rxjs';

import { RaceDayService } from './race-day.service';
import { RaceDaysTabComponent } from './race-days-tab.component';

describe('RaceDaysTabComponent', () => {
  let fixture: ComponentFixture<RaceDaysTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RaceDaysTabComponent],
      providers: [
        {
          provide: RaceDayService,
          useValue: {
            listByTournament: jasmine.createSpy('listByTournament').and.returnValue(of([])),
            create: jasmine.createSpy('create'),
            update: jasmine.createSpy('update'),
            delete: jasmine.createSpy('delete'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RaceDaysTabComponent);
    fixture.componentRef.setInput('tournament', {
      id: 'tournament-1',
      title: 'Classic',
      slug: 'classic',
      description: null,
      city: 'Lahore',
      entryFee: 500,
      totalPigeonsAllowed: 100,
      doubleStampEnabled: false,
      singleNominatedEnabled: false,
      startDate: '2026-04-01',
      endDate: '2026-04-05',
      startTime: '08:00',
      endTime: '18:00',
      status: TournamentStatus.ACTIVE,
      bannerImage: null,
      createdBy: 'user-1',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should allow management for active tournaments', () => {
    expect(fixture.componentInstance.canManage()).toBeTrue();
  });
});
