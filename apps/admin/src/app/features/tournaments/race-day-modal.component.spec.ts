import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaceDayModalComponent } from './race-day-modal.component';

describe('RaceDayModalComponent', () => {
  let fixture: ComponentFixture<RaceDayModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RaceDayModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RaceDayModalComponent);
    fixture.detectChanges();
  });

  it('should hide modal by default', () => {
    expect(fixture.nativeElement.querySelector('.modal')).toBeFalsy();
  });

  it('should show modal when open', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal')).toBeTruthy();
  });

  it('should not submit invalid forms', () => {
    const saveSpy = jasmine.createSpy('save');
    fixture.componentInstance.save.subscribe(saveSpy);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    fixture.componentInstance.onSubmit();
    expect(saveSpy).not.toHaveBeenCalled();
  });
});
