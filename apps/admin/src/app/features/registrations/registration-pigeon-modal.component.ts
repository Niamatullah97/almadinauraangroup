import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CreateRegistrationPigeonRequest,
  PigeonSex,
  PigeonStatus,
  RegistrationPigeonDto,
  UpdateRegistrationPigeonRequest,
} from '@kabootar/shared';

@Component({
  selector: 'app-registration-pigeon-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    @if (open()) {
      <div class="modal-backdrop" (click)="close.emit()" aria-hidden="true"></div>
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal__header">
          <h3>{{ pigeon() ? 'Edit pigeon' : 'Add pigeon' }}</h3>
          <button type="button" class="modal__close" (click)="close.emit()" aria-label="Close">×</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="modal__body">
            <div class="form-field">
              <label class="form-label" for="ringNumber">Ring number</label>
              <input
                id="ringNumber"
                type="text"
                class="form-control"
                formControlName="ringNumber"
                [class.is-invalid]="showError('ringNumber')"
              />
              @if (showError('ringNumber')) {
                <p class="form-error">Ring number is required.</p>
              }
            </div>

            <div class="form-field">
              <label class="form-label" for="pigeonNumber">Pigeon number</label>
              <input
                id="pigeonNumber"
                type="number"
                min="1"
                class="form-control"
                formControlName="pigeonNumber"
              />
              <p class="form-hint">Leave blank to auto-assign the next number.</p>
            </div>

            <div class="form-field">
              <label class="form-label" for="color">Color</label>
              <input id="color" type="text" class="form-control" formControlName="color" />
            </div>

            <div class="form-field">
              <label class="form-label" for="gender">Gender</label>
              <select id="gender" class="form-control" formControlName="gender">
                @for (option of genderOptions; track option) {
                  <option [value]="option">{{ option }}</option>
                }
              </select>
            </div>

            <div class="form-field">
              <label class="form-label" for="status">Status</label>
              <select id="status" class="form-control" formControlName="status">
                @for (option of statusOptions; track option) {
                  <option [value]="option">{{ option }}</option>
                }
              </select>
            </div>

            @if (doubleStampEnabled()) {
              <label class="checkbox-field">
                <input type="checkbox" formControlName="isDoubleStamp" />
                Double stamp pigeon
              </label>
            }

            @if (submitError()) {
              <p class="form-error">{{ submitError() }}</p>
            }
          </div>

          <div class="modal__actions">
            <button type="button" class="btn btn-secondary" (click)="close.emit()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="submitting() || form.invalid">
              {{ submitting() ? 'Saving...' : pigeon() ? 'Update pigeon' : 'Add pigeon' }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styleUrls: [
    '../tournaments/tournament-shared.scss',
    '../tournaments/race-day-modal.component.scss',
    './registration-pigeon-modal.component.scss',
  ],
})
export class RegistrationPigeonModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly open = input(false);
  readonly pigeon = input<RegistrationPigeonDto | null>(null);
  readonly doubleStampEnabled = input(false);
  readonly submitting = input(false);
  readonly submitError = input<string | null>(null);

  readonly save = output<CreateRegistrationPigeonRequest | UpdateRegistrationPigeonRequest>();
  readonly close = output<void>();

  readonly genderOptions = Object.values(PigeonSex);
  readonly statusOptions = Object.values(PigeonStatus);

  readonly form = this.fb.nonNullable.group({
    ringNumber: ['', Validators.required],
    pigeonNumber: [null as number | null],
    color: ['', Validators.required],
    gender: [PigeonSex.COCK, Validators.required],
    status: [PigeonStatus.ACTIVE, Validators.required],
    isDoubleStamp: [false],
  });

  constructor() {
    effect(() => {
      if (!this.open()) return;

      const pigeon = this.pigeon();
      if (pigeon) {
        this.form.patchValue({
          ringNumber: pigeon.ringNumber,
          pigeonNumber: pigeon.pigeonNumber,
          color: pigeon.color,
          gender: pigeon.gender,
          status: pigeon.status,
          isDoubleStamp: pigeon.isDoubleStamp,
        });
      } else {
        this.form.reset({
          ringNumber: '',
          pigeonNumber: null,
          color: '',
          gender: PigeonSex.COCK,
          status: PigeonStatus.ACTIVE,
          isDoubleStamp: false,
        });
      }
    });
  }

  showError(field: 'ringNumber'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      ringNumber: value.ringNumber.trim(),
      color: value.color.trim(),
      gender: value.gender,
      status: value.status,
      isDoubleStamp: this.doubleStampEnabled() ? value.isDoubleStamp : false,
      ...(value.pigeonNumber ? { pigeonNumber: value.pigeonNumber } : {}),
    };

    this.save.emit(payload);
  }
}
