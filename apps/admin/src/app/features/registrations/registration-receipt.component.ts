import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  REGISTRATION_PAYMENT_STATUS_LABELS,
  RegistrationPaymentStatus,
  TournamentRegistrationDetailDto,
} from '@kabootar/shared';

@Component({
  selector: 'app-registration-receipt',
  standalone: true,
  imports: [DatePipe],
  template: `
    @if (open() && registration()) {
      <div class="modal-backdrop" (click)="close.emit()" aria-hidden="true"></div>
      <div class="modal receipt-modal" role="dialog" aria-modal="true">
        <div class="modal__header">
          <h3>Registration receipt</h3>
          <button type="button" class="modal__close" (click)="close.emit()" aria-label="Close">×</button>
        </div>

        <div class="modal__body receipt-modal__body">
          <div class="receipt-header">
            <p class="receipt-number">{{ registration()!.receiptNumber }}</p>
            <span class="status-badge" [class]="paymentStatusClass(registration()!.paymentStatus)">
              {{ statusLabels[registration()!.paymentStatus] }}
            </span>
          </div>

          <div class="receipt-grid">
            <div>
              <span class="receipt-label">Tournament</span>
              <strong>{{ registration()!.tournament?.title }}</strong>
            </div>
            <div>
              <span class="receipt-label">City</span>
              <strong>{{ registration()!.tournament?.city }}</strong>
            </div>
            <div>
              <span class="receipt-label">Participant</span>
              <strong>{{ registration()!.participant?.name }}</strong>
            </div>
            <div>
              <span class="receipt-label">Loft</span>
              <strong>{{ registration()!.participant?.loftName }}</strong>
            </div>
            <div>
              <span class="receipt-label">Pigeons</span>
              <strong>{{ registration()!.pigeonCount }}</strong>
            </div>
            <div>
              <span class="receipt-label">Entry fee / pigeon</span>
              <strong>{{ formatCurrency(registration()!.entryFeePerPigeon) }}</strong>
            </div>
            <div>
              <span class="receipt-label">Total fee</span>
              <strong>{{ formatCurrency(registration()!.totalFee) }}</strong>
            </div>
            <div>
              <span class="receipt-label">Paid amount</span>
              <strong>{{ formatCurrency(registration()!.paidAmount) }}</strong>
            </div>
            <div>
              <span class="receipt-label">Registered on</span>
              <strong>{{ registration()!.createdAt | date: 'medium' }}</strong>
            </div>
          </div>

          @if (registration()!.payments?.length) {
            <div class="receipt-payments">
              <h4>Payment history</h4>
              <ul>
                @for (payment of registration()!.payments!; track payment.id) {
                  <li>
                    {{ formatCurrency(payment.amount) }} · {{ payment.paidAt | date: 'medium' }}
                    @if (payment.notes) {
                      <span> — {{ payment.notes }}</span>
                    }
                  </li>
                }
              </ul>
            </div>
          }
        </div>

        <div class="modal__actions">
          <button type="button" class="btn btn-secondary" (click)="close.emit()">Close</button>
        </div>
      </div>
    }
  `,
  styleUrls: [
    '../tournaments/tournament-shared.scss',
    '../tournaments/race-day-modal.component.scss',
    './registration-receipt.component.scss',
  ],
})
export class RegistrationReceiptComponent {
  readonly open = input(false);
  readonly registration = input<TournamentRegistrationDetailDto | null>(null);

  readonly close = output<void>();

  readonly statusLabels = REGISTRATION_PAYMENT_STATUS_LABELS;

  paymentStatusClass(status: RegistrationPaymentStatus): string {
    return `status-badge--payment-${status.toLowerCase()}`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
