import { DatePipe } from '@angular/common';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  ACCESS_LINK_EXPIRY_LABELS,
  AccessLinkExpiryPreset,
  CreatedTournamentAccessLinkDto,
  TournamentAccessLinkDto,
} from '@kabootar/shared';

import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { AccessLinkService } from './access-link.service';

@Component({
  selector: 'app-organizer-access-tab',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, ConfirmationDialogComponent],
  template: `
    <section class="access-tab">
      <div class="page-toolbar">
        <div>
          <h3 class="access-tab__title">Organizer access</h3>
          <p class="access-tab__subtitle">
            Share a link and secret key so the tournament organizer can preview details and enter
            landing times after a race day starts.
          </p>
        </div>
      </div>

      <form class="form-card access-tab__form" [formGroup]="form" (ngSubmit)="createLink()">
        <div class="form-grid">
          <div class="form-field">
            <label class="form-label" for="expiryPreset">Expiration</label>
            <select id="expiryPreset" class="form-control" formControlName="expiryPreset">
              @for (preset of expiryPresets; track preset) {
                <option [value]="preset">{{ expiryLabels[preset] }}</option>
              }
            </select>
          </div>
          @if (form.controls.expiryPreset.value === customPreset) {
            <div class="form-field">
              <label class="form-label" for="expiresAt">Custom expiration</label>
              <input
                id="expiresAt"
                type="datetime-local"
                class="form-control"
                formControlName="expiresAt"
                [class.is-invalid]="form.controls.expiresAt.invalid && form.controls.expiresAt.touched"
              />
            </div>
          }
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || creating()">
            {{ creating() ? 'Creating...' : 'Generate access link' }}
          </button>
        </div>
        @if (createError()) {
          <p class="form-error">{{ createError() }}</p>
        }
      </form>

      @if (createdLink()) {
        <div class="access-tab__secret">
          <h4>Share these details once</h4>
          <p class="form-hint">The secret key is shown only now. Copy it before leaving this page.</p>
          <div class="access-tab__secret-row">
            <span class="detail-label">Access link</span>
            <code>{{ createdLink()!.accessUrl }}</code>
            <button type="button" class="btn btn-secondary btn-sm" (click)="copy(createdLink()!.accessUrl)">
              Copy link
            </button>
          </div>
          <div class="access-tab__secret-row">
            <span class="detail-label">Secret key</span>
            <code>{{ createdLink()!.secretKey }}</code>
            <button type="button" class="btn btn-secondary btn-sm" (click)="copy(createdLink()!.secretKey)">
              Copy key
            </button>
          </div>
          @if (copied()) {
            <p class="form-hint">{{ copied() }}</p>
          }
        </div>
      }

      <div class="table-card">
        @if (loading()) {
          <p class="state-message">Loading access links...</p>
        } @else if (error()) {
          <p class="form-error state-message">{{ error() }}</p>
        } @else if (links().length === 0) {
          <p class="state-message">No organizer access links yet.</p>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Expires</th>
                <th>Preset</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (link of links(); track link.id) {
                <tr>
                  <td>{{ link.createdAt | date: 'medium' }}</td>
                  <td>{{ link.expiresAt | date: 'medium' }}</td>
                  <td>{{ expiryLabels[link.expiryPreset] }}</td>
                  <td>
                    <span class="status-badge" [class]="statusClass(link)">{{ statusLabel(link) }}</span>
                  </td>
                  <td>
                    <div class="row-actions">
                      <button type="button" class="btn btn-secondary btn-sm" (click)="copy(link.accessUrl)">
                        Copy link
                      </button>
                      @if (link.isActive) {
                        <button type="button" class="btn btn-danger btn-sm" (click)="openRevokeDialog(link)">
                          Revoke
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <app-confirmation-dialog
        [open]="revokeDialogOpen()"
        title="Revoke access link"
        message="Revoke this organizer access link? The secret key will stop working immediately."
        confirmLabel="Revoke"
        (confirmed)="confirmRevoke()"
        (cancelled)="revokeDialogOpen.set(false)"
      />
    </section>
  `,
  styleUrls: ['./tournament-shared.scss', './tournament-list.component.scss', './organizer-access-tab.component.scss'],
})
export class OrganizerAccessTabComponent implements OnInit {
  readonly tournamentId = input.required<string>();

  private readonly accessLinkService = inject(AccessLinkService);
  private readonly fb = inject(FormBuilder);

  readonly expiryPresets = Object.values(AccessLinkExpiryPreset);
  readonly expiryLabels = ACCESS_LINK_EXPIRY_LABELS;
  readonly customPreset = AccessLinkExpiryPreset.CUSTOM;

  readonly links = signal<TournamentAccessLinkDto[]>([]);
  readonly createdLink = signal<CreatedTournamentAccessLinkDto | null>(null);
  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly createError = signal<string | null>(null);
  readonly copied = signal<string | null>(null);
  readonly revokeDialogOpen = signal(false);

  private linkToRevoke: TournamentAccessLinkDto | null = null;

  readonly form = this.fb.nonNullable.group({
    expiryPreset: this.fb.nonNullable.control<AccessLinkExpiryPreset>(
      AccessLinkExpiryPreset.DAYS_7,
    ),
    expiresAt: [''],
  });

  ngOnInit(): void {
    this.loadLinks();
  }

  createLink(): void {
    if (this.form.invalid) return;

    const preset = this.form.controls.expiryPreset.value;
    if (preset === AccessLinkExpiryPreset.CUSTOM && !this.form.controls.expiresAt.value) {
      this.form.controls.expiresAt.markAsTouched();
      this.form.controls.expiresAt.setErrors({ required: true });
      return;
    }

    this.creating.set(true);
    this.createError.set(null);
    this.copied.set(null);

    const expiresAtValue = this.form.controls.expiresAt.value;
    this.accessLinkService
      .create(this.tournamentId(), {
        expiryPreset: preset,
        ...(preset === AccessLinkExpiryPreset.CUSTOM && expiresAtValue
          ? { expiresAt: new Date(expiresAtValue).toISOString() }
          : {}),
      })
      .subscribe({
        next: (link) => {
          this.createdLink.set(link);
          this.creating.set(false);
          this.loadLinks();
        },
        error: (err) => {
          this.createError.set(this.extractError(err, 'Unable to create access link.'));
          this.creating.set(false);
        },
      });
  }

  copy(value: string): void {
    void navigator.clipboard.writeText(value).then(() => {
      this.copied.set('Copied to clipboard.');
    });
  }

  statusLabel(link: TournamentAccessLinkDto): string {
    if (link.isRevoked) return 'Revoked';
    if (link.isExpired) return 'Expired';
    return 'Active';
  }

  statusClass(link: TournamentAccessLinkDto): string {
    if (link.isRevoked) return 'status-badge--cancelled';
    if (link.isExpired) return 'status-badge--completed';
    return 'status-badge--active';
  }

  openRevokeDialog(link: TournamentAccessLinkDto): void {
    this.linkToRevoke = link;
    this.revokeDialogOpen.set(true);
  }

  confirmRevoke(): void {
    if (!this.linkToRevoke) return;

    this.accessLinkService.revoke(this.tournamentId(), this.linkToRevoke.id).subscribe({
      next: () => {
        this.revokeDialogOpen.set(false);
        this.linkToRevoke = null;
        this.loadLinks();
      },
      error: () => {
        this.error.set('Unable to revoke access link.');
        this.revokeDialogOpen.set(false);
      },
    });
  }

  private loadLinks(): void {
    this.loading.set(true);
    this.error.set(null);

    this.accessLinkService.list(this.tournamentId()).subscribe({
      next: (response) => {
        this.links.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load access links.');
        this.loading.set(false);
      },
    });
  }

  private extractError(error: unknown, fallback: string): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error?: { message?: string } }).error?.message === 'string'
    ) {
      return (error as { error: { message: string } }).error.message;
    }
    return fallback;
  }
}
