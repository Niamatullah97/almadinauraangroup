import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import {
  CreateRegistrationRequest,
  TournamentDetailDto,
  TournamentRegistrationDetailDto,
  TournamentStatus,
  UpdateRegistrationRequest,
} from '@kabootar/shared';

import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {
  RegistrationFormSubmit,
  RegistrationModalComponent,
} from '../registrations/registration-modal.component';
import { RegistrationReceiptComponent } from '../registrations/registration-receipt.component';
import { RegistrationService } from '../registrations/registration.service';
import { ParticipantService } from '../participants/participant.service';

@Component({
  selector: 'app-registrations-tab',
  standalone: true,
  imports: [
    ConfirmationDialogComponent,
    RegistrationModalComponent,
    RegistrationReceiptComponent,
  ],
  template: `
    <section class="registrations-tab">
      <div class="page-toolbar">
        <div>
          <h3 class="registrations-tab__title">Registrations</h3>
          <p class="registrations-tab__subtitle">
            Register participants for this tournament. Each participant is assigned
            Pigeon 1 through the tournament pigeon count.
          </p>
        </div>
        @if (canManage()) {
          <button type="button" class="btn btn-primary" (click)="openCreateModal()">Add participant</button>
        }
      </div>

      @if (!canManage()) {
        <p class="form-hint registrations-tab__hint">
          Registrations can only be edited while the tournament is Draft or Active.
        </p>
      }

      <div class="table-card">
        @if (loading()) {
          <p class="state-message">Loading registrations...</p>
        } @else if (error()) {
          <p class="form-error state-message">{{ error() }}</p>
        } @else if (registrations().length === 0) {
          <p class="state-message">No participants registered yet.</p>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Loft</th>
                <th>Status</th>
                <th>Receipt</th>
                @if (canManage()) {
                  <th>Actions</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (registration of registrations(); track registration.id) {
                <tr>
                  <td>
                    <div class="participant-cell">
                      @if (profileUrl(registration); as imageUrl) {
                        <img
                          [src]="imageUrl"
                          [alt]="registration.participant?.name ?? 'Participant'"
                          class="participant-cell__avatar"
                          (error)="onPhotoError(registration.id)"
                        />
                      } @else {
                        <span
                          class="participant-cell__avatar participant-cell__avatar--placeholder"
                          aria-hidden="true"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </span>
                      }
                      <span class="participant-cell__name">{{ registration.participant?.name }}</span>
                    </div>
                  </td>
                  <td>{{ registration.participant?.loftName }}</td>
                  <td>
                    <span class="status-badge status-badge--active">Active</span>
                  </td>
                  <td>
                    <button type="button" class="btn btn-secondary btn-sm" (click)="openReceipt(registration)">
                      {{ registration.receiptNumber }}
                    </button>
                  </td>
                  @if (canManage()) {
                    <td>
                      <div class="row-actions">
                        <button type="button" class="btn btn-secondary btn-sm" (click)="openEditModal(registration)">
                          Edit
                        </button>
                        <button type="button" class="btn btn-danger btn-sm" (click)="openDeleteDialog(registration)">
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
      </div>

      <app-registration-modal
        [open]="modalOpen()"
        [tournament]="tournament()"
        [registration]="selectedRegistration()"
        [submitting]="saving()"
        [submitError]="saveError()"
        (save)="saveRegistration($event)"
        (close)="closeModal()"
      />

      <app-registration-receipt
        [open]="receiptOpen()"
        [registration]="receiptRegistration()"
        (close)="closeReceipt()"
      />

      <app-confirmation-dialog
        [open]="deleteDialogOpen()"
        title="Remove registration"
        [message]="deleteMessage()"
        confirmLabel="Remove"
        (confirmed)="confirmDelete()"
        (cancelled)="closeDeleteDialog()"
      />
    </section>
  `,
  styleUrls: [
    '../tournaments/tournament-shared.scss',
    '../tournaments/tournament-list.component.scss',
    './registrations-tab.component.scss',
  ],
})
export class RegistrationsTabComponent implements OnInit {
  readonly tournament = input.required<TournamentDetailDto>();

  private readonly registrationService = inject(RegistrationService);
  private readonly participantService = inject(ParticipantService);

  readonly registrations = signal<TournamentRegistrationDetailDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly modalOpen = signal(false);
  readonly receiptOpen = signal(false);
  readonly selectedRegistration = signal<TournamentRegistrationDetailDto | null>(null);
  readonly receiptRegistration = signal<TournamentRegistrationDetailDto | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly deleteDialogOpen = signal(false);
  readonly deleteMessage = signal('Remove this registration?');

  private registrationToDelete: TournamentRegistrationDetailDto | null = null;

  readonly canManage = computed(() => {
    const status = this.tournament().status;
    return status === TournamentStatus.DRAFT || status === TournamentStatus.ACTIVE;
  });

  private readonly failedPhotos = signal(new Set<string>());

  profileUrl(registration: TournamentRegistrationDetailDto): string | null {
    if (this.failedPhotos().has(registration.id)) return null;
    return this.participantService.resolveProfileUrl(registration.participant?.profileImage);
  }

  onPhotoError(registrationId: string): void {
    this.failedPhotos.update((ids) => new Set(ids).add(registrationId));
  }

  ngOnInit(): void {
    this.loadRegistrations();
  }

  openCreateModal(): void {
    this.selectedRegistration.set(null);
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  openEditModal(registration: TournamentRegistrationDetailDto): void {
    this.selectedRegistration.set(registration);
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.selectedRegistration.set(null);
    this.saveError.set(null);
  }

  openReceipt(registration: TournamentRegistrationDetailDto): void {
    this.registrationService.getById(registration.id).subscribe({
      next: (detail) => {
        this.receiptRegistration.set(detail);
        this.receiptOpen.set(true);
      },
      error: () => {
        this.error.set('Unable to load receipt.');
      },
    });
  }

  closeReceipt(): void {
    this.receiptOpen.set(false);
    this.receiptRegistration.set(null);
  }

  saveRegistration(event: RegistrationFormSubmit): void {
    this.saving.set(true);
    this.saveError.set(null);

    const selected = this.selectedRegistration();
    const request$ = selected
      ? this.registrationService.update(selected.id, event.payload as UpdateRegistrationRequest)
      : this.registrationService.create(event.payload as CreateRegistrationRequest);

    request$.subscribe({
      next: (saved) => {
        if (event.profileFile && saved.participantId) {
          this.uploadProfileThenFinish(saved.participantId, event.profileFile);
          return;
        }

        this.finishSave();
      },
      error: (err) => {
        this.saveError.set(this.extractErrorMessage(err));
        this.saving.set(false);
      },
    });
  }

  openDeleteDialog(registration: TournamentRegistrationDetailDto): void {
    this.registrationToDelete = registration;
    this.deleteMessage.set(`Remove ${registration.participant?.name ?? 'this participant'} from the tournament?`);
    this.deleteDialogOpen.set(true);
  }

  closeDeleteDialog(): void {
    this.deleteDialogOpen.set(false);
    this.registrationToDelete = null;
  }

  confirmDelete(): void {
    if (!this.registrationToDelete) return;

    this.registrationService.delete(this.registrationToDelete.id).subscribe({
      next: () => {
        this.closeDeleteDialog();
        this.loadRegistrations();
      },
      error: () => {
        this.error.set('Unable to remove registration.');
        this.closeDeleteDialog();
      },
    });
  }

  private finishSave(): void {
    this.saving.set(false);
    this.closeModal();
    this.loadRegistrations();
  }

  private uploadProfileThenFinish(participantId: string, file: File): void {
    this.participantService.uploadProfile(participantId, file).subscribe({
      next: () => this.finishSave(),
      error: () => {
        this.saveError.set('Participant saved, but profile upload failed. You can retry from Edit.');
        this.saving.set(false);
      },
    });
  }

  private loadRegistrations(): void {
    this.loading.set(true);
    this.error.set(null);

    this.registrationService.list({ tournamentId: this.tournament().id, limit: 100 }).subscribe({
      next: (response) => {
        this.registrations.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load registrations.');
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

    return 'Unable to save registration. Please review the form and try again.';
  }
}
