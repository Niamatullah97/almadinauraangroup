import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiResponse, LoginRequest, UserRole } from '@kabootar/shared';

import { environment } from '../../../environments/environment';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly currentUser$ = new BehaviorSubject<AuthUser | null>(this.loadUser());

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.storeTokens(res.data);
            this.currentUser$.next(res.data.user);
          }
        }),
      );
  }

  logout(redirect = true): void {
    this.clearSession();
    if (redirect) {
      this.router.navigate(['/auth/login']);
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser$.value;
  }

  isSuperAdmin(): boolean {
    return this.getCurrentUser()?.role === UserRole.SUPER_ADMIN;
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    if (this.isTokenExpired(token)) {
      this.clearSession();
      return false;
    }

    return true;
  }

  get user$(): Observable<AuthUser | null> {
    return this.currentUser$.asObservable();
  }

  private storeTokens(data: LoginResponse): void {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  private loadUser(): AuthUser | null {
    const token = localStorage.getItem('accessToken');
    if (!token || this.isTokenExpired(token)) {
      this.clearStorageOnly();
      return null;
    }

    const raw = localStorage.getItem('user');
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      this.clearStorageOnly();
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { exp?: number };
      if (!payload.exp) {
        return false;
      }

      return payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  private clearSession(): void {
    this.clearStorageOnly();
    this.currentUser$.next(null);
  }

  private clearStorageOnly(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}
