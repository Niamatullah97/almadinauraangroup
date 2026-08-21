import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TournamentStatus } from '@kabootar/shared';

import { TournamentListComponent } from './tournament-list.component';
import { TournamentService } from './tournament.service';

describe('TournamentListComponent', () => {
  let fixture: ComponentFixture<TournamentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentListComponent],
      providers: [
        provideRouter([]),
        {
          provide: TournamentService,
          useValue: {
            list: jasmine.createSpy('list').and.returnValue(
              of({
                items: [
                  {
                    id: '1',
                    title: 'Spring Classic',
                    slug: 'spring-classic',
                    description: null,
                    city: 'Lahore',
                    entryFee: 500,
                    totalPigeonsAllowed: 100,
                    doubleStampEnabled: false,
                    startDate: '2026-04-01',
                    endDate: '2026-04-02',
                    startTime: '08:00',
                    endTime: '18:00',
                    status: TournamentStatus.DRAFT,
                    bannerImage: null,
                    createdBy: 'user-1',
                    createdAt: '2026-01-01',
                    updatedAt: '2026-01-01',
                  },
                ],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
              }),
            ),
            delete: jasmine.createSpy('delete').and.returnValue(of({ id: '1' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentListComponent);
    fixture.detectChanges();
  });

  it('should create and render tournaments', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Spring Classic');
  });
});
