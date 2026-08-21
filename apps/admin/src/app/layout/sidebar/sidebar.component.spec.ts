import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render navigation links', () => {
    const links = fixture.nativeElement.querySelectorAll('.sidebar__link');
    expect(links.length).toBe(5);
  });

  it('should apply open class when mobileOpen is true', () => {
    fixture.componentRef.setInput('mobileOpen', true);
    fixture.detectChanges();

    const sidebar = fixture.nativeElement.querySelector('.sidebar');
    expect(sidebar.classList.contains('sidebar--open')).toBeTrue();
  });
});
