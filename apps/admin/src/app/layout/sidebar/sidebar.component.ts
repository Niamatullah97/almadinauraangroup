import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ADMIN_NAV_ITEMS, NavItem } from '../../shared/models/nav-item.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    @if (mobileOpen()) {
      <div
        class="sidebar-backdrop"
        (click)="closeMobile.emit()"
        aria-hidden="true"
      ></div>
    }

    <aside
      class="sidebar"
      [class.sidebar--open]="mobileOpen()"
      aria-label="Main navigation"
    >
      <div class="sidebar__brand">
        <img class="sidebar__logo" src="assets/logo.png" alt="AlMadina Uraan Group" />
      </div>

      <nav class="sidebar__nav">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="sidebar__link--active"
            [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
            class="sidebar__link"
            (click)="closeMobile.emit()"
          >
            <span class="sidebar__link-icon" [attr.data-icon]="item.icon" aria-hidden="true">
              @switch (item.icon) {
                @case ('dashboard') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                }
                @case ('tournaments') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
                  </svg>
                }
                @case ('pigeons') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 7h.01M3 11l9-7 9 7v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                }
                @case ('landing') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="13" r="8" />
                    <path d="M12 9v4l2 2" />
                    <path d="M5 3 2 6" />
                    <path d="m22 6-3-3" />
                    <path d="M12 5V3" />
                  </svg>
                }
                @case ('reports') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                  </svg>
                }
                @case ('users') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                }
              }
            </span>
            {{ item.label }}
          </a>
        }
      </nav>

      <div class="sidebar__footer">
        <p class="sidebar__version">Pigeon Tournament Management</p>
      </div>
    </aside>
  `,
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly navItems: NavItem[] = ADMIN_NAV_ITEMS;
  readonly mobileOpen = input(false);
  readonly closeMobile = output<void>();
}
