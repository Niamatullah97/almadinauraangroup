import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CreateRegistrationRequest,
  TournamentDetailDto,
  TournamentRegistrationDetailDto,
  UpdateRegistrationRequest,
} from '@kabootar/shared';

import { ParticipantService } from '../participants/participant.service';

export interface RegistrationFormSubmit {
  payload: CreateRegistrationRequest | UpdateRegistrationRequest;
  profileFile: File | null;
}

@Component({
  selector: 'app-registration-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    @if (open()) {
      <div class="modal-backdrop" (click)="close.emit()" aria-hidden="true"></div>
      <div class="modal modal--wide" role="dialog" aria-modal="true">
        <div class="modal__header">
          <h3>{{ registration() ? 'Edit participant' : 'Add participant' }}</h3>
          <button type="button" class="modal__close" (click)="close.emit()" aria-label="Close">×</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="modal__body">
            <div class="form-grid">
              <div class="form-field form-grid__full profile-upload">
                <label class="form-label">Profile image</label>
                @if (profilePreview()) {
                  <img [src]="profilePreview()!" alt="Profile preview" class="profile-preview" />
                } @else {
                  <div class="profile-placeholder">{{ initials() }}</div>
                }
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  (change)="onProfileSelected($event)"
                />
                @if (profileError()) {
                  <p class="form-error">{{ profileError() }}</p>
                } @else {
                  <p class="form-hint">JPEG, PNG, or WebP up to 5MB.</p>
                }
              </div>

              <div class="form-field">
                <label class="form-label" for="name">Name</label>
                <input
                  id="name"
                  type="text"
                  class="form-control"
                  formControlName="name"
                  [class.is-invalid]="showError('name')"
                />
                @if (showError('name')) {
                  <p class="form-error">Name is required.</p>
                }
              </div>

              <div class="form-field">
                <label class="form-label" for="fatherName">Father name</label>
                <input
                  id="fatherName"
                  type="text"
                  class="form-control"
                  formControlName="fatherName"
                  [class.is-invalid]="showError('fatherName')"
                />
                @if (showError('fatherName')) {
                  <p class="form-error">Father name is required.</p>
                }
              </div>

              <div class="form-field">
                <label class="form-label" for="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  class="form-control"
                  formControlName="phone"
                  [class.is-invalid]="showError('phone')"
                  placeholder="+923001234567"
                />
                @if (showError('phone')) {
                  <p class="form-error">Enter a valid phone number.</p>
                }
              </div>

              <div class="form-field">
                <label class="form-label" for="city">City</label>
                <input
                  id="city"
                  type="text"
                  class="form-control"
                  formControlName="city"
                  [class.is-invalid]="showError('city')"
                />
                @if (showError('city')) {
                  <p class="form-error">City is required.</p>
                }
              </div>

              <div class="form-field">
                <label class="form-label" for="loftName">Loft name</label>
                <input
                  id="loftName"
                  type="text"
                  class="form-control"
                  formControlName="loftName"
                  [class.is-invalid]="showError('loftName')"
                />
                @if (showError('loftName')) {
                  <p class="form-error">Loft name is required.</p>
                }
              </div>

              <div class="form-field form-grid__full">
                <label class="form-label" for="address">Address</label>
                <textarea id="address" class="form-control" formControlName="address"></textarea>
              </div>
            </div>

            @if (submitError()) {
              <p class="form-error">{{ submitError() }}</p>
            }
          </div>

          <div class="modal__actions">
            <button type="button" class="btn btn-secondary" (click)="close.emit()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="submitting() || form.invalid">
              {{ submitting() ? 'Saving...' : registration() ? 'Update participant' : 'Add participant' }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styleUrls: [
    '../tournaments/tournament-shared.scss',
    '../tournaments/race-day-modal.component.scss',
    './registration-modal.component.scss',
  ],
})
export class RegistrationModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly participantService = inject(ParticipantService);

  readonly open = input(false);
  readonly tournament = input.required<TournamentDetailDto>();
  readonly registration = input<TournamentRegistrationDetailDto | null>(null);
  readonly submitting = input(false);
  readonly submitError = input<string | null>(null);

  readonly save = output<RegistrationFormSubmit>();
  readonly close = output<void>();

  readonly profilePreview = signal<string | null>(null);
  readonly profileError = signal<string | null>(null);
  readonly initials = signal('?');
  private selectedProfile: File | null = null;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    fatherName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    phone: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s-]{7,20}$/)]],
    city: ['', [Validators.required, Validators.maxLength(120)]],
    address: [''],
    loftName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
  });

  constructor() {
    effect(() => {
      if (!this.open()) return;

      const registration = this.registration();
      this.selectedProfile = null;
      this.profileError.set(null);

      if (registration) {
        const participant = registration.participant;
        this.form.patchValue({
          name: participant?.name ?? '',
          fatherName: participant?.fatherName ?? '',
          phone: participant?.phone ?? '',
          city: participant?.city ?? '',
          address: participant?.address ?? '',
          loftName: participant?.loftName ?? '',
        });
        this.initials.set(this.participantService.getInitials(participant?.name ?? ''));
        this.profilePreview.set(
          this.participantService.resolveProfileUrl(participant?.profileImage),
        );
      } else {
        this.form.reset({
          name: '',
          fatherName: '',
          phone: '',
          city: '',
          address: '',
          loftName: '',
        });
        this.initials.set('?');
        this.profilePreview.set(null);
      }
    });

    this.form.controls.name.valueChanges.subscribe((name) => {
      this.initials.set(this.participantService.getInitials(name || ''));
    });
  }

  showError(field: 'name' | 'fatherName' | 'phone' | 'city' | 'loftName'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  onProfileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.profileError.set(null);

    if (!file) {
      this.selectedProfile = null;
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.profileError.set('Please upload a JPEG, PNG, or WebP image.');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.profileError.set('Profile image must be 5MB or smaller.');
      input.value = '';
      return;
    }

    this.selectedProfile = file;
    this.profilePreview.set(URL.createObjectURL(file));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const participant = {
      name: value.name,
      fatherName: value.fatherName,
      phone: value.phone,
      city: value.city,
      loftName: value.loftName,
      ...(value.address && { address: value.address }),
    };

    if (this.registration()) {
      this.save.emit({
        payload: { participant },
        profileFile: this.selectedProfile,
      });
      return;
    }

    this.save.emit({
      payload: {
        tournamentId: this.tournament().id,
        participant,
      },
      profileFile: this.selectedProfile,
    });
  }
}
