import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import {
  CreateRegistrationPigeonRequest,
  RegistrationPigeonDto,
  TournamentRegistrationDetailDto,
  TournamentStatus,
  UpdateRegistrationPigeonRequest,
} from '@kabootar/shared';

import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { RegistrationPigeonModalComponent } from './registration-pigeon-modal.component';
import { RegistrationPigeonService } from './registration-pigeon.service';

@Component({
  selector: 'app-registration-pigeons-panel',
  standalone: true,
  imports: [ConfirmationDialogComponent, RegistrationPigeonModalComponent],
  template: `
    @if (open()) {
      <div class="modal-backdrop" (click)="close.emit()" aria-hidden="true"></div>
      <div class="modal pigeons-panel" role="dialog" aria-modal="true">
        <div class="modal__header">
          <div>
            <h3>Pigeons — {{ registration()?.participant?.name }}</h3>
            <p class="form-hint">
              {{ summary()?.registeredCount ?? 0 }} pigeon(s)
              @if ((summary()?.remainingCount ?? 0) > 0) {
                · {{ summary()?.remainingCount }} tournament slot(s) left
              }
            </p>
          </div>
          <button type="button" class="modal__close" (click)="close.emit()" aria-label="Close">×</button>
        </div>

        <div class="modal__body">
          @if (canManage()) {
            <div class="page-toolbar pigeons-panel__toolbar">
              <button type="button" class="btn btn-primary btn-sm" (click)="openCreateModal()">Add pigeon</button>
            </div>
          }

          @if (loading()) {
            <p class="state-message">Loading pigeons...</p>
          } @else if (error()) {
            <p class="form-error state-message">{{ error() }}</p>
          } @else if (pigeons().length === 0) {
            <p class="state-message">No pigeons added yet.</p>
          } @else {
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ring</th>
                  <th>Color</th>
                  <th>Gender</th>
                  @if (doubleStampEnabled()) {
                    <th>Double stamp</th>
                  }
                  <th>Status</th>
                  @if (canManage()) {
                    <th>Actions</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (pigeon of pigeons(); track pigeon.id) {
                  <tr>
                    <td>{{ pigeon.pigeonNumber }}</td>
                    <td>{{ pigeon.ringNumber }}</td>
                    <td>{{ pigeon.color }}</td>
                    <td>{{ pigeon.gender }}</td>
                    @if (doubleStampEnabled()) {
                      <td>
                        @if (canManage()) {
                          <button
                            type="button"
                            class="toggle-chip"
                            [class.toggle-chip--active]="pigeon.isDoubleStamp"
                            (click)="toggleDoubleStamp(pigeon)"
                          >
                            {{ pigeon.isDoubleStamp ? 'Yes' : 'No' }}
                          </button>
                        } @else {
                          {{ pigeon.isDoubleStamp ? 'Yes' : 'No' }}
                        }
                      </td>
                    }
                    <td>{{ pigeon.status }}</td>
                    @if (canManage()) {
                      <td>
                        <div class="row-actions">
                          <button type="button" class="btn btn-secondary btn-sm" (click)="openEditModal(pigeon)">
                            Edit
                          </button>
                          <button type="button" class="btn btn-danger btn-sm" (click)="openDeleteDialog(pigeon)">
                            Remove
                          </button>
                        </div>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          }

          @if (saveError()) {
            <p class="form-error">{{ saveError() }}</p>
          }
        </div>

        <div class="modal__actions">
          <button type="button" class="btn btn-secondary" (click)="close.emit()">Close</button>
        </div>
      </div>

      <app-registration-pigeon-modal
        [open]="modalOpen()"
        [pigeon]="selectedPigeon()"
        [doubleStampEnabled]="doubleStampEnabled()"
        [submitting]="saving()"
        [submitError]="saveError()"
        (save)="savePigeon($event)"
        (close)="closeModal()"
      />

      <app-confirmation-dialog
        [open]="deleteDialogOpen()"
        title="Remove pigeon"
        [message]="deleteMessage()"
        confirmLabel="Remove"
        (confirmed)="confirmDelete()"
        (cancelled)="closeDeleteDialog()"
      />
    }
  `,
  styleUrls: [
    '../tournaments/tournament-shared.scss',
    '../tournaments/tournament-list.component.scss',
    '../tournaments/race-day-modal.component.scss',
    './registration-pigeons-panel.component.scss',
  ],
})
export class RegistrationPigeonsPanelComponent {
  readonly open = input(false);
  readonly registration = input<TournamentRegistrationDetailDto | null>(null);
  readonly tournamentStatus = input.required<TournamentStatus>();
  readonly doubleStampEnabled = input(false);

  readonly close = output<void>();

  private readonly registrationPigeonService = inject(RegistrationPigeonService);

  readonly pigeons = signal<RegistrationPigeonDto[]>([]);
  readonly summary = signal<{ assignedCount: number; registeredCount: number; remainingCount: number } | null>(
    null,
  );
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly modalOpen = signal(false);
  readonly selectedPigeon = signal<RegistrationPigeonDto | null>(null);
  readonly saving = signal(false);
  readonly bulkGenerating = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly deleteDialogOpen = signal(false);
  readonly deleteMessage = signal('Remove this pigeon?');

  private pigeonToDelete: RegistrationPigeonDto | null = null;

  readonly canManage = computed(() => {
    const status = this.tournamentStatus();
    return status === TournamentStatus.DRAFT || status === TournamentStatus.ACTIVE;
  });

  constructor() {
    effect(() => {
      if (this.open() && this.registration()) {
        this.loadPigeons();
      }
    });
  }

  openCreateModal(): void {
    this.selectedPigeon.set(null);
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  openEditModal(pigeon: RegistrationPigeonDto): void {
    this.selectedPigeon.set(pigeon);
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.selectedPigeon.set(null);
    this.saveError.set(null);
  }

  savePigeon(payload: CreateRegistrationPigeonRequest | UpdateRegistrationPigeonRequest): void {
    const registration = this.registration();
    if (!registration) return;

    this.saving.set(true);
    this.saveError.set(null);

    const selected = this.selectedPigeon();
    const request$ = selected
      ? this.registrationPigeonService.update(registration.id, selected.id, payload)
      : this.registrationPigeonService.create(registration.id, payload as CreateRegistrationPigeonRequest);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadPigeons();
      },
      error: (err) => {
        this.saveError.set(this.extractErrorMessage(err));
        this.saving.set(false);
      },
    });
  }

  bulkGenerate(): void {
    const registration = this.registration();
    if (!registration) return;

    this.bulkGenerating.set(true);
    this.saveError.set(null);

    this.registrationPigeonService.bulkGenerate(registration.id).subscribe({
      next: () => {
        this.bulkGenerating.set(false);
        this.loadPigeons();
      },
      error: (err) => {
        this.saveError.set(this.extractErrorMessage(err));
        this.bulkGenerating.set(false);
      },
    });
  }

  toggleDoubleStamp(pigeon: RegistrationPigeonDto): void {
    const registration = this.registration();
    if (!registration) return;

    this.registrationPigeonService.toggleDoubleStamp(registration.id, pigeon.id).subscribe({
      next: (updated) => {
        this.pigeons.update((items) =>
          items.map((item) => (item.id === updated.id ? updated : item)),
        );
      },
      error: () => {
        this.error.set('Unable to update double stamp flag.');
      },
    });
  }

  openDeleteDialog(pigeon: RegistrationPigeonDto): void {
    this.pigeonToDelete = pigeon;
    this.deleteMessage.set(`Remove pigeon #${pigeon.pigeonNumber}?`);
    this.deleteDialogOpen.set(true);
  }

  closeDeleteDialog(): void {
    this.deleteDialogOpen.set(false);
    this.pigeonToDelete = null;
  }

  confirmDelete(): void {
    const registration = this.registration();
    if (!registration || !this.pigeonToDelete) return;

    this.registrationPigeonService.delete(registration.id, this.pigeonToDelete.id).subscribe({
      next: () => {
        this.closeDeleteDialog();
        this.loadPigeons();
      },
      error: () => {
        this.error.set('Unable to remove pigeon.');
        this.closeDeleteDialog();
      },
    });
  }

  private loadPigeons(): void {
    const registration = this.registration();
    if (!registration) return;

    this.loading.set(true);
    this.error.set(null);

    this.registrationPigeonService.list(registration.id).subscribe({
      next: (response) => {
        this.pigeons.set(response.items);
        this.summary.set({
          assignedCount: response.assignedCount,
          registeredCount: response.registeredCount,
          remainingCount: response.remainingCount,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load pigeons.');
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

    return 'Unable to save pigeon. Please review the form and try again.';
  }
}
