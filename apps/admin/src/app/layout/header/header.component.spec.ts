import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { HeaderComponent } from './header.component';
import { AuthService } from '../../core/services/auth.service';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let user$: BehaviorSubject<{
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null>;

  beforeEach(async () => {
    user$ = new BehaviorSubject<{
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    } | null>({
      firstName: 'Ali',
      lastName: 'Khan',
      email: 'ali@kabootar.test',
      role: 'admin',
    });

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            user$,
            logout: jasmine.createSpy('logout'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    fixture.componentRef.setInput('title', 'Dashboard');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display page title', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Dashboard');
  });

  it('should show user initials from auth service', () => {
    expect(fixture.componentInstance.userInitials()).toBe('AK');
  });
});
