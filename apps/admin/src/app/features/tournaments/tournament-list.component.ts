import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  TOURNAMENT_STATUS_LABELS,
  TournamentDto,
  TournamentStatus,
} from '@kabootar/shared';

import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { TournamentService } from './tournament.service';

@Component({
  selector: 'app-tournament-list',
  standalone: true,
  imports: [RouterLink, DatePipe, ConfirmationDialogComponent],
  template: `
    <section class="tournament-page">
      <div class="page-toolbar">
        <div class="filters">
          <input
            type="search"
            class="form-control search-input"
            placeholder="Search by title or city"
            [value]="search()"
            (input)="onSearch($event)"
          />
          <select class="form-control status-filter" [value]="statusFilter()" (change)="onStatusChange($event)">
            <option value="">All statuses</option>
            @for (status of statusOptions; track status) {
              <option [value]="status">{{ statusLabels[status] }}</option>
            }
          </select>
        </div>
        <div class="page-toolbar__actions">
          <a routerLink="/tournaments/new" class="btn btn-primary">Create tournament</a>
        </div>
      </div>

      <div class="table-card">
        @if (loading()) {
          <p class="state-message">Loading tournaments...</p>
        } @else if (error()) {
          <p class="form-error state-message">{{ error() }}</p>
        } @else if (tournaments().length === 0) {
          <p class="state-message">No tournaments found. Create your first event to get started.</p>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Tournament</th>
                <th>City</th>
                <th>Schedule</th>
                <th>Entry fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (tournament of tournaments(); track tournament.id) {
                <tr>
                  <td>
                    <a [routerLink]="['/tournaments', tournament.id]" class="table-link">
                      {{ tournament.title }}
                    </a>
                    <span class="table-subtext">{{ tournament.slug }}</span>
                  </td>
                  <td>{{ tournament.city }}</td>
                  <td>
                    {{ tournament.startDate | date: 'mediumDate' }}
                    <span class="table-subtext">{{ tournament.startTime }} – {{ tournament.endTime }}</span>
                  </td>
                  <td>{{ formatCurrency(tournament.entryFee) }}</td>
                  <td>
                    <span class="status-badge" [class]="statusClass(tournament.status)">
                      {{ statusLabels[tournament.status] }}
                    </span>
                  </td>
                  <td>
                    <div class="row-actions">
                      <a [routerLink]="['/tournaments', tournament.id]" class="btn btn-secondary btn-sm">View</a>
                      <a [routerLink]="['/tournaments', tournament.id, 'edit']" class="btn btn-secondary btn-sm">Edit</a>
                      <button type="button" class="btn btn-danger btn-sm" (click)="openDeleteDialog(tournament)">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      @if (totalPages() > 1) {
        <div class="pagination">
          <button type="button" class="btn btn-secondary btn-sm" [disabled]="page() <= 1" (click)="goToPage(page() - 1)">
            Previous
          </button>
          <span class="pagination__label">Page {{ page() }} of {{ totalPages() }}</span>
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            [disabled]="page() >= totalPages()"
            (click)="goToPage(page() + 1)"
          >
            Next
          </button>
        </div>
      }

      <app-confirmation-dialog
        [open]="deleteDialogOpen()"
        title="Delete tournament"
        [message]="deleteMessage()"
        confirmLabel="Delete"
        (confirmed)="confirmDelete()"
        (cancelled)="closeDeleteDialog()"
      />
    </section>
  `,
  styleUrls: ['./tournament-shared.scss', './tournament-list.component.scss'],
})
export class TournamentListComponent implements OnInit {
  private readonly tournamentService = inject(TournamentService);

  readonly statusOptions = Object.values(TournamentStatus);
  readonly statusLabels = TOURNAMENT_STATUS_LABELS;

  readonly tournaments = signal<TournamentDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly search = signal('');
  readonly statusFilter = signal('');

  readonly deleteDialogOpen = signal(false);
  readonly deleteMessage = signal('');
  private tournamentToDelete: TournamentDto | null = null;

  ngOnInit(): void {
    this.loadTournaments();
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(1);
    this.loadTournaments();
  }

  onStatusChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
    this.loadTournaments();
  }

  goToPage(nextPage: number): void {
    this.page.set(nextPage);
    this.loadTournaments();
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

  openDeleteDialog(tournament: TournamentDto): void {
    this.tournamentToDelete = tournament;
    this.deleteMessage.set(`Delete "${tournament.title}"? This action cannot be undone.`);
    this.deleteDialogOpen.set(true);
  }

  closeDeleteDialog(): void {
    this.deleteDialogOpen.set(false);
    this.tournamentToDelete = null;
  }

  confirmDelete(): void {
    if (!this.tournamentToDelete) return;

    this.tournamentService.delete(this.tournamentToDelete.id).subscribe({
      next: () => {
        this.closeDeleteDialog();
        this.loadTournaments();
      },
      error: () => {
        this.error.set('Unable to delete tournament. Please try again.');
        this.closeDeleteDialog();
      },
    });
  }

  private loadTournaments(): void {
    this.loading.set(true);
    this.error.set(null);

    this.tournamentService
      .list({
        page: this.page(),
        limit: 10,
        search: this.search() || undefined,
        status: (this.statusFilter() as TournamentStatus) || undefined,
      })
      .subscribe({
        next: (response) => {
          this.tournaments.set(response.items);
          this.totalPages.set(response.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Unable to load tournaments.');
          this.loading.set(false);
        },
      });
  }
}
