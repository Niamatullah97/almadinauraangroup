import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantFormComponent } from './participant-form.component';
import { ParticipantService } from './participant.service';

describe('ParticipantFormComponent', () => {
  let fixture: ComponentFixture<ParticipantFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticipantFormComponent],
      providers: [
        {
          provide: ParticipantService,
          useValue: {
            resolveProfileUrl: (url: string | null) => url,
            getInitials: (name: string) => name.charAt(0),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ParticipantFormComponent);
    fixture.detectChanges();
  });

  it('should create with invalid default form', () => {
    expect(fixture.componentInstance.form.invalid).toBeTrue();
  });

  it('should not submit invalid forms', () => {
    const submitted = jasmine.createSpy('submitted');
    fixture.componentInstance.submitted.subscribe(submitted);
    fixture.componentInstance.onSubmit();
    expect(submitted).not.toHaveBeenCalled();
  });
});
