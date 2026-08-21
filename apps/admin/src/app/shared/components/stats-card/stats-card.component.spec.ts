import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatsCardComponent } from './stats-card.component';

describe('StatsCardComponent', () => {
  let fixture: ComponentFixture<StatsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatsCardComponent);
    fixture.componentRef.setInput('label', 'Total Tournaments');
    fixture.componentRef.setInput('value', '24');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render label and value', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Total Tournaments');
    expect(element.textContent).toContain('24');
  });

  it('should show skeleton when loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.stats-card__skeleton')).toBeTruthy();
    expect(element.querySelector('.stats-card__value')).toBeFalsy();
  });
});
