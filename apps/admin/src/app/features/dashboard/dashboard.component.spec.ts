import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './dashboard.service';
import { EMPTY_DASHBOARD_STATS } from '../../shared/models/dashboard-stats.model';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let loadStatsSpy: jasmine.Spy;

  beforeEach(async () => {
    loadStatsSpy = jasmine.createSpy('loadStats');

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            stats: signal(EMPTY_DASHBOARD_STATS),
            loading: signal(false),
            error: signal(null),
            loadStats: loadStatsSpy,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load stats on init', () => {
    expect(loadStatsSpy).toHaveBeenCalled();
  });

  it('should render six stat cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('app-stats-card');
    expect(cards.length).toBe(6);
  });

  it('should format currency values', () => {
    const formatted = fixture.componentInstance.formatCurrency(1500);
    expect(formatted).toContain('1,500');
  });
});
