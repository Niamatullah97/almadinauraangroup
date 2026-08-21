import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CreateRaceDayRequest,
  RACE_DAY_STATUS_LABELS,
  RaceDayDto,
  RaceDayStatus,
  UpdateRaceDayRequest,
} from '@kabootar/shared';

@Component({
  selector: 'app-race-day-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    @if (open()) {
      <div class="modal-backdrop" (click)="close.emit()" aria-hidden="true"></div>
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal__header">
          <h3>{{ raceDay() ? 'Edit race day' : 'Add race day' }}</h3>
          <button type="button" class="modal__close" (click)="close.emit()" aria-label="Close">
            ×
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="modal__body">
            <div class="form-field">
              <label class="form-label" for="raceDate">Race date</label>
              <input
                id="raceDate"
                type="date"
                class="form-control"
                formControlName="raceDate"
                [class.is-invalid]="showError('raceDate')"
              />
              @if (showError('raceDate')) {
                <p class="form-error">Race date is required.</p>
              }
            </div>

            <div class="form-field">
              <label class="form-label" for="releaseTime">Release time</label>
              <input
                id="releaseTime"
                type="time"
                class="form-control"
                formControlName="releaseTime"
                [class.is-invalid]="showError('releaseTime')"
              />
              @if (showError('releaseTime')) {
                <p class="form-error">Release time is required.</p>
              }
            </div>

            <div class="form-field">
              <label class="form-label" for="endTime">End time</label>
              <input
                id="endTime"
                type="time"
                class="form-control"
                formControlName="endTime"
                [class.is-invalid]="showError('endTime')"
              />
              @if (showError('endTime')) {
                <p class="form-error">End time must be after the release time.</p>
              }
            </div>

            <div class="form-field">
              <label class="form-label" for="releaseLocation">Release location</label>
              <input
                id="releaseLocation"
                type="text"
                class="form-control"
                formControlName="releaseLocation"
                [class.is-invalid]="showError('releaseLocation')"
              />
              @if (showError('releaseLocation')) {
                <p class="form-error">Release location is required.</p>
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

            <div class="form-field">
              <label class="form-label" for="weatherNotes">Weather notes</label>
              <textarea
                id="weatherNotes"
                class="form-control"
                formControlName="weatherNotes"
                placeholder="Optional wind, visibility, or temperature notes."
              ></textarea>
            </div>

            @if (submitError()) {
              <p class="form-error">{{ submitError() }}</p>
            }
          </div>

          <div class="modal__actions">
            <button type="button" class="btn btn-secondary" (click)="close.emit()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="submitting() || form.invalid">
              {{ submitting() ? 'Saving...' : 'Save race day' }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styleUrls: ['./tournament-shared.scss', './race-day-modal.component.scss'],
})
export class RaceDayModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly open = input(false);
  readonly raceDay = input<RaceDayDto | null>(null);
  readonly submitting = input(false);
  readonly submitError = input<string | null>(null);

  readonly save = output<CreateRaceDayRequest | UpdateRaceDayRequest>();
  readonly close = output<void>();

  readonly statusOptions = Object.values(RaceDayStatus);
  readonly statusLabels = RACE_DAY_STATUS_LABELS;

  readonly form = this.fb.nonNullable.group({
    raceDate: ['', Validators.required],
    releaseTime: ['06:30', Validators.required],
    endTime: ['18:00', Validators.required],
    releaseLocation: ['', [Validators.required, Validators.maxLength(255)]],
    weatherNotes: [''],
    status: [RaceDayStatus.PENDING, Validators.required],
  });

  constructor() {
    effect(() => {
      const value = this.raceDay();
      if (value) {
        this.form.patchValue({
          raceDate: value.raceDate,
          releaseTime: value.releaseTime,
          endTime: value.endTime,
          releaseLocation: value.releaseLocation,
          weatherNotes: value.weatherNotes ?? '',
          status: value.status,
        });
      } else if (this.open()) {
        this.form.reset({
          raceDate: '',
          releaseTime: '06:30',
          endTime: '18:00',
          releaseLocation: '',
          weatherNotes: '',
          status: RaceDayStatus.PENDING,
        });
      }
    });
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.endTime <= raw.releaseTime) {
      this.form.controls.endTime.setErrors({ afterRelease: true });
      this.form.controls.endTime.markAsTouched();
      return;
    }

    this.save.emit({
      ...raw,
      weatherNotes: raw.weatherNotes || undefined,
    });
  }
}
