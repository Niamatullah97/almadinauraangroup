import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RecordPaymentRequest } from '@kabootar/shared';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    @if (open()) {
      <div class="modal-backdrop" (click)="close.emit()" aria-hidden="true"></div>
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal__header">
          <h3>Record payment</h3>
          <button type="button" class="modal__close" (click)="close.emit()" aria-label="Close">×</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="modal__body">
            @if (remainingAmount() !== null) {
              <p class="form-hint">Outstanding balance: {{ formatCurrency(remainingAmount()!) }}</p>
            }

            <div class="form-field">
              <label class="form-label" for="amount">Amount</label>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                class="form-control"
                formControlName="amount"
                [class.is-invalid]="showError('amount')"
              />
              @if (showError('amount')) {
                <p class="form-error">Enter a valid payment amount.</p>
              }
            </div>

            <div class="form-field">
              <label class="form-label" for="notes">Notes</label>
              <input id="notes" type="text" class="form-control" formControlName="notes" />
            </div>

            @if (submitError()) {
              <p class="form-error">{{ submitError() }}</p>
            }
          </div>

          <div class="modal__actions">
            <button type="button" class="btn btn-secondary" (click)="close.emit()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="submitting() || form.invalid">
              {{ submitting() ? 'Saving...' : 'Record payment' }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styleUrls: ['../tournaments/tournament-shared.scss', '../tournaments/race-day-modal.component.scss'],
})
export class PaymentModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly open = input(false);
  readonly remainingAmount = input<number | null>(null);
  readonly submitting = input(false);
  readonly submitError = input<string | null>(null);

  readonly save = output<RecordPaymentRequest>();
  readonly close = output<void>();

  readonly form = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    notes: [''],
  });

  constructor() {
    effect(() => {
      if (!this.open()) return;
      const remaining = this.remainingAmount();
      this.form.reset({
        amount: remaining && remaining > 0 ? remaining : 0,
        notes: '',
      });
    });
  }

  showError(field: 'amount'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.save.emit({
      amount: value.amount,
      ...(value.notes && { notes: value.notes }),
    });
  }
}
