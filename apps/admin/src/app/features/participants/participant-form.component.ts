import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ParticipantDto,
  RegistrationParticipantInput,
  UpdateParticipantRequest,
} from '@kabootar/shared';

import { ParticipantService } from './participant.service';

export interface ParticipantFormSubmit {
  payload: RegistrationParticipantInput | UpdateParticipantRequest;
  profileFile: File | null;
}

@Component({
  selector: 'app-participant-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form class="form-card" [formGroup]="form" (ngSubmit)="onSubmit()">
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
        <p class="form-error form-grid__full">{{ submitError() }}</p>
      }

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" (click)="cancelled.emit()">Cancel</button>
        <button type="submit" class="btn btn-primary" [disabled]="submitting() || form.invalid">
          {{ submitting() ? 'Saving...' : submitLabel() }}
        </button>
      </div>
    </form>
  `,
  styleUrl: './participant-shared.scss',
})
export class ParticipantFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly participantService = inject(ParticipantService);

  readonly participant = input<ParticipantDto | null>(null);
  readonly submitLabel = input('Save participant');
  readonly submitting = input(false);
  readonly submitError = input<string | null>(null);

  readonly submitted = output<ParticipantFormSubmit>();
  readonly cancelled = output<void>();

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
      const value = this.participant();
      if (!value) {
        this.initials.set('?');
        return;
      }

      this.form.patchValue({
        name: value.name,
        fatherName: value.fatherName,
        phone: value.phone,
        city: value.city,
        address: value.address ?? '',
        loftName: value.loftName,
      });

      this.initials.set(this.participantService.getInitials(value.name));
      this.profilePreview.set(this.participantService.resolveProfileUrl(value.profileImage));
    });

    this.form.get('name')?.valueChanges.subscribe((name) => {
      this.initials.set(this.participantService.getInitials(name || ''));
    });
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
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

    const raw = this.form.getRawValue();
    this.submitted.emit({
      payload: {
        ...raw,
        address: raw.address || undefined,
      },
      profileFile: this.selectedProfile,
    });
  }
}
