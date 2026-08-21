import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { OrganizerSessionService } from '../../core/services/organizer-session.service';

@Component({
  selector: 'app-organizer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="organizer-layout">
      <header class="organizer-header">
        <div>
          <p class="organizer-kicker">Organizer access</p>
          <h1>{{ tournamentTitle() }}</h1>
        </div>
        <nav class="organizer-nav">
          <a routerLink="preview" routerLinkActive="organizer-nav__link--active">Preview</a>
          <a routerLink="landing-times" routerLinkActive="organizer-nav__link--active">Landing times</a>
          <button type="button" (click)="endSession()">End session</button>
        </nav>
      </header>
      <main class="organizer-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .organizer-layout {
        min-height: 100vh;
        background: #f8fafc;
      }
      .organizer-header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.25rem 1.5rem;
        background: #1a1a2e;
        color: #fff;
      }
      h1 {
        margin: 0.15rem 0 0;
        font-size: 1.35rem;
      }
      .organizer-kicker {
        margin: 0;
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #94a3b8;
      }
      .organizer-nav {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
      }
      .organizer-nav a,
      .organizer-nav button {
        padding: 0.5rem 0.85rem;
        border-radius: 6px;
        border: 0;
        background: transparent;
        color: #e2e8f0;
        text-decoration: none;
        font: inherit;
        cursor: pointer;
      }
      .organizer-nav__link--active {
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
      }
      .organizer-nav button {
        background: #334155;
      }
      .organizer-main {
        max-width: 1400px;
        margin: 0 auto;
        padding: 1.5rem;
      }
    `,
  ],
})
export class OrganizerLayoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly organizerSession = inject(OrganizerSessionService);

  tournamentTitle(): string {
    return this.organizerSession.getTournament()?.title ?? 'Tournament';
  }

  endSession(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.organizerSession.clear();
    void this.router.navigate(['/organizer', token]);
  }
}
