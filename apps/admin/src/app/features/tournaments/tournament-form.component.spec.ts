import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TournamentFormComponent } from './tournament-form.component';
import { TournamentService } from './tournament.service';

describe('TournamentFormComponent', () => {
  let fixture: ComponentFixture<TournamentFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentFormComponent],
      providers: [
        {
          provide: TournamentService,
          useValue: {
            resolveBannerUrl: (url: string | null) => url,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentFormComponent);
    fixture.detectChanges();
  });

  it('should create with default form values', () => {
    expect(fixture.componentInstance.form.get('title')?.invalid).toBeTrue();
  });

  it('should not submit invalid forms', () => {
    const submitted = jasmine.createSpy('submitted');
    fixture.componentInstance.submitted.subscribe(submitted);
    fixture.componentInstance.onSubmit();
    expect(submitted).not.toHaveBeenCalled();
  });
});
