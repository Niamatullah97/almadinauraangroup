import { Component, computed, inject, OnInit } from '@angular/core';

import { StatsCardComponent } from '../../shared/components/stats-card/stats-card.component';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [StatsCardComponent],
  template: `
    <section class="dashboard">
      <div class="dashboard__welcome">
        <div>
          <h2 class="dashboard__heading">Welcome back</h2>
          <p class="dashboard__description">
            Monitor tournaments, participants, and financial metrics at a glance.
          </p>
        </div>
        <button
          type="button"
          class="dashboard__refresh"
          [disabled]="dashboardService.loading()"
          (click)="dashboardService.loadStats()"
        >
          {{ dashboardService.loading() ? 'Refreshing...' : 'Refresh stats' }}
        </button>
      </div>

      @if (dashboardService.error()) {
        <p class="dashboard__error">{{ dashboardService.error() }}</p>
      }

      <div class="dashboard__grid">
        <app-stats-card
          label="Total Tournaments"
          [value]="formatCount(stats().totalTournaments)"
          subtitle="All registered events"
          icon="trophy"
          variant="primary"
          [loading]="dashboardService.loading()"
        />
        <app-stats-card
          label="Active Tournaments"
          [value]="formatCount(stats().activeTournaments)"
          subtitle="Currently in progress"
          icon="activity"
          variant="success"
          [loading]="dashboardService.loading()"
        />
        <app-stats-card
          label="Total Participants"
          [value]="formatCount(stats().totalParticipants)"
          subtitle="Registered across tournaments"
          icon="users"
          variant="info"
          [loading]="dashboardService.loading()"
        />
        <app-stats-card
          label="Total Pigeons"
          [value]="formatCount(stats().totalPigeons)"
          subtitle="Registered tournament pigeons"
          icon="bird"
          variant="accent"
          [loading]="dashboardService.loading()"
        />
        <app-stats-card
          label="Total Entry Fees"
          [value]="formatCurrency(stats().totalEntryFees)"
          subtitle="Billed from registrations"
          icon="fee"
          variant="warning"
          [loading]="dashboardService.loading()"
        />
        <app-stats-card
          label="Total Prize Pool"
          [value]="formatCurrency(stats().totalPrizePool)"
          subtitle="Collected fees available as prizes"
          icon="prize"
          variant="primary"
          [loading]="dashboardService.loading()"
        />
      </div>
    </section>
  `,
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly dashboardService = inject(DashboardService);

  readonly stats = computed(() => this.dashboardService.stats());

  ngOnInit(): void {
    this.dashboardService.loadStats();
  }

  formatCount(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
