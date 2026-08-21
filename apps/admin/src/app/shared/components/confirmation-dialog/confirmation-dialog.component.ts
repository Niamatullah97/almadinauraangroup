import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  template: `
    @if (open()) {
      <div class="dialog-backdrop" (click)="cancelled.emit()" aria-hidden="true"></div>
      <div class="dialog" role="dialog" aria-modal="true" [attr.aria-labelledby]="dialogId">
        <h2 class="dialog__title" [id]="dialogId">{{ title() }}</h2>
        <p class="dialog__message">{{ message() }}</p>
        <div class="dialog__actions">
          <button type="button" class="btn btn-secondary" (click)="cancelled.emit()">
            {{ cancelLabel() }}
          </button>
          <button type="button" class="btn btn-danger" (click)="confirmed.emit()">
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .dialog-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        z-index: 80;
      }

      .dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 90;
        width: min(92vw, 420px);
        background: #fff;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
      }

      .dialog__title {
        font-size: 1.125rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }

      .dialog__message {
        color: #64748b;
        margin-bottom: 1.25rem;
        line-height: 1.5;
      }

      .dialog__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }

      .btn {
        padding: 0.625rem 1rem;
        border-radius: 8px;
        border: 1px solid transparent;
        font-weight: 600;
        cursor: pointer;
      }

      .btn-secondary {
        background: #fff;
        border-color: #e2e8f0;
      }

      .btn-danger {
        background: #fef2f2;
        border-color: rgba(220, 38, 38, 0.2);
        color: #dc2626;
      }
    `,
  ],
})
export class ConfirmationDialogComponent {
  readonly dialogId = `confirm-dialog-${Math.random().toString(36).slice(2, 9)}`;

  readonly open = input(false);
  readonly title = input('Confirm action');
  readonly message = input('Are you sure you want to continue?');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
