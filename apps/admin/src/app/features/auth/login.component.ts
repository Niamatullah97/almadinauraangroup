import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-page">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <img class="logo" src="assets/logo.png" alt="AlMadina Uraan Group" />
        @if (error) {
          <p class="error">{{ error }}</p>
        }
        <label>
          Email
          <input type="email" formControlName="email" />
        </label>
        <label>
          Password
          <input type="password" formControlName="password" />
        </label>
        <button type="submit" [disabled]="form.invalid || loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  `,
  styles: [
    `
      .login-page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: #1a1a2e;
      }
      form {
        background: #fff;
        padding: 1.5rem 2rem 2rem;
        border-radius: 8px;
        width: 360px;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .logo {
        display: block;
        width: 100%;
        height: auto;
        margin: 0 auto 0.25rem;
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.875rem;
      }
      input {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
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
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  error = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    this.authService.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        if (res.success && res.data && this.authService.isAuthenticated()) {
          if (!this.authService.isSuperAdmin()) {
            this.authService.logout(false);
            this.error = 'Only Super Admin can access the admin dashboard.';
          } else {
            this.router.navigate(['/dashboard']);
          }
        } else {
          this.error = res.message || 'Login failed. Please try again.';
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Invalid credentials';
        this.loading = false;
      },
    });
  }
}
