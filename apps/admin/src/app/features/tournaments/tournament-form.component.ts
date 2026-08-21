import {
  Component,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CreateTournamentRequest,
  TOURNAMENT_STATUS_LABELS,
  TournamentDetailDto,
  TournamentStatus,
  UpdateTournamentRequest,
} from '@kabootar/shared';

import { TournamentService } from './tournament.service';

export interface TournamentFormSubmit {
  payload: CreateTournamentRequest | UpdateTournamentRequest;
  bannerFile: File | null;
}

@Component({
  selector: 'app-tournament-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form class="form-card" [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="form-grid">
        <div class="form-field form-grid__full">
          <label class="form-label" for="title">Tournament name</label>
          <input
            id="title"
            type="text"
            class="form-control"
            formControlName="title"
            [class.is-invalid]="showError('title')"
            placeholder="Spring Classic 2026"
          />
          @if (showError('title')) {
            <p class="form-error">Tournament name is required (max 200 characters).</p>
          }
        </div>

        <div class="form-field form-grid__full banner-upload">
          <label class="form-label" for="banner">Tournament banner</label>
          @if (bannerPreview()) {
            <img [src]="bannerPreview()!" alt="Tournament banner preview" class="banner-preview" />
          } @else {
            <div class="banner-placeholder">Upload a JPEG, PNG, or WebP image up to 5MB.</div>
          }
          <input
            id="banner"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            (change)="onBannerSelected($event)"
          />
          @if (bannerError()) {
            <p class="form-error">{{ bannerError() }}</p>
          } @else {
            <p class="form-hint">Recommended size: 1200 x 400px.</p>
          }
        </div>

        <div class="form-field">
          <label class="form-label" for="entryFee">Entry fee (PKR)</label>
          <input
            id="entryFee"
            type="number"
            min="0"
            step="0.01"
            class="form-control"
            formControlName="entryFee"
            [class.is-invalid]="showError('entryFee')"
          />
          @if (showError('entryFee')) {
            <p class="form-error">Entry fee must be zero or greater.</p>
          }
        </div>

        <div class="form-field">
          <label class="form-label" for="totalPigeonsAllowed">Pigeons per participant</label>
          <input
            id="totalPigeonsAllowed"
            type="number"
            min="1"
            class="form-control"
            formControlName="totalPigeonsAllowed"
            [class.is-invalid]="showError('totalPigeonsAllowed')"
          />
          <p class="form-hint">Every registered participant is assigned Pigeon 1 through this number.</p>
          @if (showError('totalPigeonsAllowed')) {
            <p class="form-error">At least one pigeon per participant is required.</p>
          }
        </div>

        <div class="form-field">
          <label class="form-label" for="startDate">Start date</label>
          <input
            id="startDate"
            type="date"
            class="form-control"
            formControlName="startDate"
            [class.is-invalid]="showError('startDate') || form.hasError('dateRange')"
          />
          @if (showError('startDate')) {
            <p class="form-error">Start date is required.</p>
          }
        </div>

        <div class="form-field">
          <label class="form-label" for="endDate">End date</label>
          <input
            id="endDate"
            type="date"
            class="form-control"
            formControlName="endDate"
            [class.is-invalid]="showError('endDate') || form.hasError('dateRange')"
          />
          @if (showError('endDate')) {
            <p class="form-error">End date is required.</p>
          } @else if (form.hasError('dateRange') && form.touched) {
            <p class="form-error">End date must be on or after start date.</p>
          }
        </div>

        <div class="form-field">
          <label class="form-label" for="startTime">Start time</label>
          <input
            id="startTime"
            type="time"
            class="form-control"
            formControlName="startTime"
            [class.is-invalid]="showError('startTime') || form.hasError('timeRange')"
          />
          @if (showError('startTime')) {
            <p class="form-error">Start time is required.</p>
          }
        </div>

        <div class="form-field">
          <label class="form-label" for="endTime">End time</label>
          <input
            id="endTime"
            type="time"
            class="form-control"
            formControlName="endTime"
            [class.is-invalid]="showError('endTime') || form.hasError('timeRange')"
          />
          @if (showError('endTime')) {
            <p class="form-error">End time is required.</p>
          } @else if (form.hasError('timeRange') && form.touched) {
            <p class="form-error">End time must be after start time.</p>
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
            placeholder="Lahore"
          />
          @if (showError('city')) {
            <p class="form-error">City is required.</p>
          }
        </div>

        <div class="form-field">
          <label class="form-label" for="status">Status</label>
          <select id="status" class="form-control" formControlName="status">
            @for (status of statusOptions; track status) {
              <option [value]="status">{{ statusLabels[status] }}</option>
            }
          </select>
        </div>

        <label class="checkbox-field form-grid__full">
          <input id="doubleStampEnabled" type="checkbox" formControlName="doubleStampEnabled" />
          Enable double stamp (nominated pigeon)
        </label>
        <p class="form-hint form-grid__full">
          When enabled, admins can mark nominated pigeons while entering landing times. Public
          results show a Double stamp badge on those pigeons.
        </p>

        <div class="form-field form-grid__full">
          <label class="form-label" for="description">Description</label>
          <textarea
            id="description"
            class="form-control"
            formControlName="description"
            placeholder="Share rules, prize details, and schedule notes."
          ></textarea>
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
  styleUrls: ['./tournament-shared.scss', './tournament-form.component.scss'],
})
export class TournamentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tournamentService = inject(TournamentService);

  readonly tournament = input<TournamentDetailDto | null>(null);
  readonly submitLabel = input('Save tournament');
  readonly submitting = input(false);
  readonly submitError = input<string | null>(null);

  readonly submitted = output<TournamentFormSubmit>();
  readonly cancelled = output<void>();

  readonly statusOptions = Object.values(TournamentStatus);
  readonly statusLabels = TOURNAMENT_STATUS_LABELS;

  readonly bannerPreview = signal<string | null>(null);
  readonly bannerError = signal<string | null>(null);
  private selectedBanner: File | null = null;

  readonly form = this.fb.nonNullable.group(
    {
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      city: ['', [Validators.required, Validators.maxLength(120)]],
      entryFee: [0, [Validators.required, Validators.min(0)]],
      totalPigeonsAllowed: [1, [Validators.required, Validators.min(1)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      startTime: ['08:00', Validators.required],
      endTime: ['18:00', Validators.required],
      status: [TournamentStatus.DRAFT, Validators.required],
      doubleStampEnabled: [false],
    },
    {
      validators: (group) => {
        const errors: Record<string, true> = {};
        const start = group.get('startDate')?.value;
        const end = group.get('endDate')?.value;
        if (start && end && new Date(end) < new Date(start)) {
          errors['dateRange'] = true;
        }

        const startTime = group.get('startTime')?.value;
        const endTime = group.get('endTime')?.value;
        if (startTime && endTime && endTime <= startTime) {
          errors['timeRange'] = true;
        }

        return Object.keys(errors).length > 0 ? errors : null;
      },
    },
  );

  constructor() {
    effect(() => {
      const value = this.tournament();
      if (!value) return;

      this.form.patchValue({
        title: value.title,
        description: value.description ?? '',
        city: value.city,
        entryFee: value.entryFee,
        totalPigeonsAllowed: value.totalPigeonsAllowed,
        startDate: value.startDate,
        endDate: value.endDate,
        startTime: value.startTime,
        endTime: value.endTime,
        status: value.status,
        doubleStampEnabled: value.doubleStampEnabled,
      });

      this.bannerPreview.set(this.tournamentService.resolveBannerUrl(value.bannerImage));
    });
  }

  ngOnInit(): void {
    if (!this.tournament()) {
      this.form.patchValue({ status: TournamentStatus.DRAFT });
    }
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onBannerSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.bannerError.set(null);

    if (!file) {
      this.selectedBanner = null;
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.bannerError.set('Please upload a JPEG, PNG, or WebP image.');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.bannerError.set('Banner must be 5MB or smaller.');
      input.value = '';
      return;
    }

    this.selectedBanner = file;
    this.bannerPreview.set(URL.createObjectURL(file));
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
        description: raw.description || undefined,
      },
      bannerFile: this.selectedBanner,
    });
  }
}
