import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  TOURNAMENT_STATUS_LABELS,
  TournamentDetailDto,
  TournamentStatus,
} from '@kabootar/shared';

import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { RaceDaysTabComponent } from './race-days-tab.component';
import { RegistrationsTabComponent } from './registrations-tab.component';
import { OrganizerAccessTabComponent } from './organizer-access-tab.component';
import { TournamentService } from './tournament.service';

type DetailTab = 'overview' | 'race-days' | 'registrations' | 'organizer-access';

@Component({
  selector: 'app-tournament-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, ConfirmationDialogComponent, RaceDaysTabComponent, RegistrationsTabComponent, OrganizerAccessTabComponent],
  template: `
    @if (loading()) {
      <p class="state-message">Loading tournament...</p>
    } @else if (error()) {
      <p class="form-error state-message">{{ error() }}</p>
    } @else if (tournament()) {
      <section class="detail-page">
        <div class="page-toolbar">
          <a routerLink="/tournaments" class="btn btn-secondary">Back to list</a>
          <div class="page-toolbar__actions">
            <a [routerLink]="['/tournaments', tournament()!.id, 'edit']" class="btn btn-primary">Edit tournament</a>
            <button type="button" class="btn btn-danger" (click)="openDeleteDialog(tournament()!.title)">Delete</button>
          </div>
        </div>

        @if (bannerUrl()) {
          <img [src]="bannerUrl()!" [alt]="tournament()!.title + ' banner'" class="detail-banner" />
        }

        <div class="detail-card">
          <div class="detail-header">
            <div>
              <h2 class="detail-title">{{ tournament()!.title }}</h2>
              <p class="detail-subtitle">{{ tournament()!.city }} · {{ tournament()!.slug }}</p>
            </div>
            <span class="status-badge" [class]="statusClass(tournament()!.status)">
              {{ statusLabels[tournament()!.status] }}
            </span>
          </div>

          <div class="detail-tabs">
            <button
              type="button"
              class="detail-tab"
              [class.detail-tab--active]="activeTab() === 'overview'"
              (click)="setTab('overview')"
            >
              Overview
            </button>
            <button
              type="button"
              class="detail-tab"
              [class.detail-tab--active]="activeTab() === 'race-days'"
              (click)="setTab('race-days')"
            >
              Race days
            </button>
            <button
              type="button"
              class="detail-tab"
              [class.detail-tab--active]="activeTab() === 'registrations'"
              (click)="setTab('registrations')"
            >
              Registrations
            </button>
            <button
              type="button"
              class="detail-tab"
              [class.detail-tab--active]="activeTab() === 'organizer-access'"
              (click)="setTab('organizer-access')"
            >
              Organizer access
            </button>
          </div>

          @if (activeTab() === 'overview') {
            @if (tournament()!.description) {
              <p class="detail-description">{{ tournament()!.description }}</p>
            }

            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Entry fee</span>
                <strong>{{ formatCurrency(tournament()!.entryFee) }}</strong>
              </div>
              <div class="detail-item">
                <span class="detail-label">Pigeons per participant</span>
                <strong>{{ tournament()!.totalPigeonsAllowed }}</strong>
              </div>
              <div class="detail-item">
                <span class="detail-label">Start date</span>
                <strong>{{ tournament()!.startDate | date: 'mediumDate' }}</strong>
              </div>
              <div class="detail-item">
                <span class="detail-label">End date</span>
                <strong>{{ tournament()!.endDate | date: 'mediumDate' }}</strong>
              </div>
              <div class="detail-item">
                <span class="detail-label">Start time</span>
                <strong>{{ tournament()!.startTime }}</strong>
              </div>
              <div class="detail-item">
                <span class="detail-label">End time</span>
                <strong>{{ tournament()!.endTime }}</strong>
              </div>
              <div class="detail-item">
                <span class="detail-label">Entries</span>
                <strong>{{ tournament()!.entryCount ?? 0 }}</strong>
              </div>
              <div class="detail-item">
                <span class="detail-label">Double stamp</span>
                <strong>{{ tournament()!.doubleStampEnabled ? 'Enabled' : 'Disabled' }}</strong>
              </div>
            </div>

            @if (tournament()!.creator) {
              <div class="detail-meta">
                Created by {{ tournament()!.creator!.firstName }} {{ tournament()!.creator!.lastName }}
              </div>
            }
          } @else if (activeTab() === 'race-days') {
            <app-race-days-tab [tournament]="tournament()!" />
          } @else if (activeTab() === 'registrations') {
            <app-registrations-tab [tournament]="tournament()!" />
          } @else {
            <app-organizer-access-tab [tournamentId]="tournament()!.id" />
          }
        </div>
      </section>

      <app-confirmation-dialog
        [open]="deleteDialogOpen()"
        title="Delete tournament"
        [message]="deleteMessage()"
        confirmLabel="Delete"
        (confirmed)="confirmDelete(tournament()!.id)"
        (cancelled)="deleteDialogOpen.set(false)"
      />
    }
  `,
  styleUrls: ['./tournament-shared.scss', './tournament-detail.component.scss', './tournament-list.component.scss'],
})
export class TournamentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tournamentService = inject(TournamentService);

  readonly statusLabels = TOURNAMENT_STATUS_LABELS;
  readonly tournament = signal<TournamentDetailDto | null>(null);
  readonly bannerUrl = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly deleteDialogOpen = signal(false);
  readonly deleteMessage = signal('Delete this tournament? This action cannot be undone.');
  readonly activeTab = signal<DetailTab>('overview');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.tournamentService.getById(id).subscribe({
      next: (tournament) => {
        this.tournament.set(tournament);
        this.bannerUrl.set(this.tournamentService.resolveBannerUrl(tournament.bannerImage));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load tournament details.');
        this.loading.set(false);
      },
    });
  }

  setTab(tab: DetailTab): void {
    this.activeTab.set(tab);
  }

  statusClass(status: TournamentStatus): string {
    return `status-badge--${status.toLowerCase()}`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  openDeleteDialog(title: string): void {
    this.deleteMessage.set(`Delete "${title}"? This action cannot be undone.`);
    this.deleteDialogOpen.set(true);
  }

  confirmDelete(id: string): void {
    this.tournamentService.delete(id).subscribe({
      next: () => {
        this.router.navigate(['/tournaments']);
      },
      error: () => {
        this.error.set('Unable to delete tournament.');
        this.deleteDialogOpen.set(false);
      },
    });
  }
}
