import { Component, input } from '@angular/core';

export type StatsCardVariant = 'primary' | 'success' | 'warning' | 'info' | 'accent';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  template: `
    <article class="stats-card" [class.stats-card--loading]="loading()">
      @if (loading()) {
        <div class="stats-card__skeleton" aria-hidden="true">
          <div class="skeleton-line skeleton-line--label"></div>
          <div class="skeleton-line skeleton-line--value"></div>
        </div>
      } @else {
        <div class="stats-card__header">
          <p class="stats-card__label">{{ label() }}</p>
          <div class="stats-card__icon" [class]="'stats-card__icon--' + variant()">
            @switch (icon()) {
              @case ('trophy') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
                  <path d="M7 4H5a2 2 0 0 0-2 2v1a3 3 0 0 0 3 3M17 4h2a2 2 0 0 1 2 2v1a3 3 0 0 1-3 3" />
                </svg>
              }
              @case ('activity') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              @case ('users') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              @case ('bird') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 7h.01M3 11l9-7 9 7v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <path d="M9 22V12h6v10" />
                </svg>
              }
              @case ('fee') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              }
              @case ('prize') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              }
            }
          </div>
        </div>
        <p class="stats-card__value">{{ value() }}</p>
        @if (subtitle()) {
          <p class="stats-card__subtitle">{{ subtitle() }}</p>
        }
      }
    </article>
  `,
  styleUrl: './stats-card.component.scss',
})
export class StatsCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly subtitle = input<string>();
  readonly icon = input<
    'trophy' | 'activity' | 'users' | 'bird' | 'fee' | 'prize'
  >('trophy');
  readonly variant = input<StatsCardVariant>('primary');
  readonly loading = input(false);
}
