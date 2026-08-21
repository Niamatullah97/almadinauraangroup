import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import {
  CreateRaceDayRequest,
  RACE_DAY_STATUS_LABELS,
  RaceDayDto,
  RaceDayStatus,
  TournamentDetailDto,
  TournamentStatus,
  UpdateRaceDayRequest,
} from '@kabootar/shared';

import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { RaceDayModalComponent } from './race-day-modal.component';
import { RaceDayService } from './race-day.service';

@Component({
  selector: 'app-race-days-tab',
  standalone: true,
  imports: [DatePipe, ConfirmationDialogComponent, RaceDayModalComponent],
  template: `
    <section class="race-days-tab">
      <div class="page-toolbar">
        <div>
          <h3 class="race-days-tab__title">Race days</h3>
          <p class="race-days-tab__subtitle">
            Schedule release dates for this tournament. Results will be tracked per race day.
          </p>
        </div>
        @if (canManage()) {
          <button type="button" class="btn btn-primary" (click)="openCreateModal()">
            Add race day
          </button>
        }
      </div>

      @if (!readOnly() && !canManage()) {
        <p class="form-hint race-days-tab__hint">
          Race days can only be edited while the tournament is Draft or Active.
        </p>
      }

      <div class="table-card">
        @if (loading()) {
          <p class="state-message">Loading race days...</p>
        } @else if (error()) {
          <p class="form-error state-message">{{ error() }}</p>
        } @else if (raceDays().length === 0) {
          <p class="state-message">No race days scheduled yet.</p>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Race date</th>
                <th>Release time</th>
                <th>End time</th>
                <th>Location</th>
                <th>Weather</th>
                <th>Status</th>
                @if (canManage()) {
                  <th>Actions</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (raceDay of raceDays(); track raceDay.id) {
                <tr>
                  <td>{{ raceDay.raceDate | date: 'mediumDate' }}</td>
                  <td>{{ raceDay.releaseTime }}</td>
                  <td>{{ raceDay.endTime }}</td>
                  <td>{{ raceDay.releaseLocation }}</td>
                  <td>{{ raceDay.weatherNotes || '—' }}</td>
                  <td>
                    <span class="status-badge" [class]="statusClass(raceDay.status)">
                      {{ statusLabels[raceDay.status] }}
                    </span>
                  </td>
                  @if (canManage()) {
                    <td>
                      <div class="row-actions">
                        <button
                          type="button"
                          class="btn btn-secondary btn-sm"
                          (click)="openEditModal(raceDay)"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          class="btn btn-danger btn-sm"
                          (click)="openDeleteDialog(raceDay)"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <app-race-day-modal
        [open]="modalOpen()"
        [raceDay]="selectedRaceDay()"
        [submitting]="saving()"
        [submitError]="saveError()"
        (save)="saveRaceDay($event)"
        (close)="closeModal()"
      />

      <app-confirmation-dialog
        [open]="deleteDialogOpen()"
        title="Delete race day"
        [message]="deleteMessage()"
        confirmLabel="Delete"
        (confirmed)="confirmDelete()"
        (cancelled)="closeDeleteDialog()"
      />
    </section>
  `,
  styleUrls: [
    './tournament-shared.scss',
    './tournament-list.component.scss',
    './race-days-tab.component.scss',
  ],
})
export class RaceDaysTabComponent implements OnInit {
  readonly tournament = input.required<TournamentDetailDto>();
  readonly readOnly = input(false);

  private readonly raceDayService = inject(RaceDayService);

  readonly statusLabels = RACE_DAY_STATUS_LABELS;
  readonly raceDays = signal<RaceDayDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly modalOpen = signal(false);
  readonly selectedRaceDay = signal<RaceDayDto | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly deleteDialogOpen = signal(false);
  readonly deleteMessage = signal('Delete this race day?');

  private raceDayToDelete: RaceDayDto | null = null;

  readonly canManage = computed(() => {
    if (this.readOnly()) return false;
    const status = this.tournament().status;
    return status === TournamentStatus.DRAFT || status === TournamentStatus.ACTIVE;
  });

  ngOnInit(): void {
    this.loadRaceDays();
  }

  statusClass(status: RaceDayStatus): string {
    return `status-badge--race-${status.toLowerCase()}`;
  }

  openCreateModal(): void {
    this.selectedRaceDay.set(null);
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  openEditModal(raceDay: RaceDayDto): void {
    this.selectedRaceDay.set(raceDay);
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.selectedRaceDay.set(null);
    this.saveError.set(null);
  }

  saveRaceDay(payload: CreateRaceDayRequest | UpdateRaceDayRequest): void {
    this.saving.set(true);
    this.saveError.set(null);

    const tournamentId = this.tournament().id;
    const selected = this.selectedRaceDay();

    const request$ = selected
      ? this.raceDayService.update(tournamentId, selected.id, payload)
      : this.raceDayService.create(tournamentId, payload as CreateRaceDayRequest);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadRaceDays();
      },
      error: (err) => {
        this.saveError.set(this.extractErrorMessage(err));
        this.saving.set(false);
      },
    });
  }

  openDeleteDialog(raceDay: RaceDayDto): void {
    this.raceDayToDelete = raceDay;
    this.deleteMessage.set(`Delete race day on ${raceDay.raceDate}?`);
    this.deleteDialogOpen.set(true);
  }

  closeDeleteDialog(): void {
    this.deleteDialogOpen.set(false);
    this.raceDayToDelete = null;
  }

  confirmDelete(): void {
    if (!this.raceDayToDelete) return;

    this.raceDayService.delete(this.tournament().id, this.raceDayToDelete.id).subscribe({
      next: () => {
        this.closeDeleteDialog();
        this.loadRaceDays();
      },
      error: () => {
        this.error.set('Unable to delete race day.');
        this.closeDeleteDialog();
      },
    });
  }

  private loadRaceDays(): void {
    this.loading.set(true);
    this.error.set(null);

    this.raceDayService.listByTournament(this.tournament().id).subscribe({
      next: (items) => {
        this.raceDays.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load race days.');
        this.loading.set(false);
      },
    });
  }

  private extractErrorMessage(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error?: { message?: string } }).error?.message === 'string'
    ) {
      return (error as { error: { message: string } }).error.message;
    }

    return 'Unable to save race day. Please review the form and try again.';
  }
}
