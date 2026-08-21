import { Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="header">
      <div class="header__left">
        <button
          type="button"
          class="header__menu-btn"
          (click)="toggleSidebar.emit()"
          aria-label="Toggle navigation menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div class="header__titles">
          <h1 class="header__title">{{ title() }}</h1>
          @if (subtitle()) {
            <p class="header__subtitle">{{ subtitle() }}</p>
          }
        </div>
      </div>

      <div class="header__actions">
        <div class="header__user">
          <div class="header__avatar" aria-hidden="true">
            {{ userInitials() }}
          </div>
          <div class="header__user-info">
            <p class="header__user-name">{{ userName() }}</p>
            <p class="header__user-role">{{ userRole() }}</p>
          </div>
        </div>

        <button
          type="button"
          class="header__logout"
          (click)="authService.logout()"
          aria-label="Sign out"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span class="header__logout-text">Logout</span>
        </button>
      </div>
    </header>
  `,
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly authService = inject(AuthService);

  readonly title = input('Dashboard');
  readonly subtitle = input<string>();
  readonly toggleSidebar = output<void>();

  private readonly user = toSignal(this.authService.user$, { initialValue: null });

  readonly userName = computed(() => {
    const current = this.user();
    if (!current) return 'Admin User';
    return `${current.firstName} ${current.lastName}`.trim() || current.email;
  });

  readonly userRole = computed(() => {
    const role = this.user()?.role;
    if (!role) return 'Administrator';
    return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ');
  });

  readonly userInitials = computed(() => {
    const current = this.user();
    if (!current) return 'A';
    const first = current.firstName?.charAt(0) ?? '';
    const last = current.lastName?.charAt(0) ?? '';
    const initials = `${first}${last}`.trim();
    return initials || current.email.charAt(0).toUpperCase();
  });
}
