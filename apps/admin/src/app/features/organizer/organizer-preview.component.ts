import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TOURNAMENT_STATUS_LABELS } from '@kabootar/shared';

import { OrganizerSessionService } from '../../core/services/organizer-session.service';
import { TournamentService } from '../tournaments/tournament.service';
import { RaceDaysTabComponent } from '../tournaments/race-days-tab.component';

@Component({
  selector: 'app-organizer-preview',
  standalone: true,
  imports: [DatePipe, RaceDaysTabComponent],
  template: `
    @if (tournament; as event) {
      <section class="detail-page">
        @if (bannerUrl) {
          <img [src]="bannerUrl" [alt]="event.title + ' banner'" class="detail-banner" />
        }
        <div class="detail-card">
          <div class="detail-header">
            <div>
              <h2 class="detail-title">{{ event.title }}</h2>
              <p class="detail-subtitle">{{ event.city }} · {{ event.slug }}</p>
            </div>
            <span class="status-badge" [class]="'status-badge--' + event.status.toLowerCase()">
              {{ statusLabels[event.status] }}
            </span>
          </div>

          @if (event.description) {
            <p class="detail-description">{{ event.description }}</p>
          }

          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Entry fee</span>
              <strong>{{ formatCurrency(event.entryFee) }}</strong>
            </div>
            <div class="detail-item">
              <span class="detail-label">Pigeons per participant</span>
              <strong>{{ event.totalPigeonsAllowed }}</strong>
            </div>
            <div class="detail-item">
              <span class="detail-label">Start date</span>
              <strong>{{ event.startDate | date: 'mediumDate' }}</strong>
            </div>
            <div class="detail-item">
              <span class="detail-label">End date</span>
              <strong>{{ event.endDate | date: 'mediumDate' }}</strong>
            </div>
            <div class="detail-item">
              <span class="detail-label">Start time</span>
              <strong>{{ event.startTime }}</strong>
            </div>
            <div class="detail-item">
              <span class="detail-label">End time</span>
              <strong>{{ event.endTime }}</strong>
            </div>
          </div>
        </div>

        <div class="detail-card">
          <app-race-days-tab [tournament]="event" [readOnly]="true" />
        </div>
      </section>
    }
  `,
  styleUrls: [
    '../tournaments/tournament-shared.scss',
    '../tournaments/tournament-detail.component.scss',
    '../tournaments/tournament-list.component.scss',
  ],
})
export class OrganizerPreviewComponent {
  private readonly organizerSession = inject(OrganizerSessionService);
  private readonly tournamentService = inject(TournamentService);

  readonly statusLabels = TOURNAMENT_STATUS_LABELS;
  readonly tournament = this.organizerSession.getTournament();
  readonly bannerUrl = this.tournamentService.resolveBannerUrl(this.tournament?.bannerImage);

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
