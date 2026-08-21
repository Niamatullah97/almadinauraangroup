import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { OrganizerSessionService } from '../../core/services/organizer-session.service';
import { AccessLinkService } from '../tournaments/access-link.service';

@Component({
  selector: 'app-organizer-unlock',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="unlock-page">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <p class="unlock-kicker">Tournament organizer</p>
        <h2>Enter secret key</h2>
        <p class="unlock-copy">
          Use the access link and secret key shared by Super Admin. This key only works until it
          expires.
        </p>
        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        <label>
          Secret key
          <input type="text" formControlName="secretKey" autocomplete="off" />
        </label>
        <button type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Checking...' : 'Continue' }}
        </button>
      </form>
    </div>
  `,
  styles: [
    `
      .unlock-page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: #1a1a2e;
      }
      form {
        background: #fff;
        padding: 2rem;
        border-radius: 8px;
        width: min(92vw, 400px);
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      h2 {
        margin: 0;
        text-align: center;
      }
      .unlock-kicker {
        margin: 0;
        text-align: center;
        font-size: 0.8125rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #64748b;
      }
      .unlock-copy {
        margin: 0;
        text-align: center;
        color: #64748b;
        font-size: 0.9375rem;
        line-height: 1.5;
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.875rem;
      }
      input {
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font: inherit;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      button {
        padding: 0.75rem;
        background: #1a1a2e;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.6;
      }
      .error {
        color: #e74c3c;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class OrganizerUnlockComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly accessLinkService = inject(AccessLinkService);
  private readonly organizerSession = inject(OrganizerSessionService);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    secretKey: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    if (this.organizerSession.hasValidSession(token)) {
      void this.router.navigate(['/organizer', token, 'preview']);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.loading.set(true);
    this.error.set('');

    this.accessLinkService
      .unlock({ token, secretKey: this.form.controls.secretKey.value })
      .subscribe({
        next: (response) => {
          this.organizerSession.store(token, response);
          void this.router.navigate(['/organizer', token, 'preview']);
        },
        error: (err) => {
          this.error.set(this.extractError(err));
          this.loading.set(false);
        },
      });
  }

  private extractError(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error?: { message?: string } }).error?.message === 'string'
    ) {
      return (error as { error: { message: string } }).error.message;
    }
    return 'Invalid or expired secret key.';
  }
}
