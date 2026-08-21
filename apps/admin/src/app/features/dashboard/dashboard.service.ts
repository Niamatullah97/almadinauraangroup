import { Injectable, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import {
  DashboardStats,
  EMPTY_DASHBOARD_STATS,
} from '../../shared/models/dashboard-stats.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  readonly stats = signal<DashboardStats>(EMPTY_DASHBOARD_STATS);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadStats(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api
      .get<DashboardStats>('/dashboard/stats')
      .pipe(
        tap((response) => {
          this.stats.set(response.data ?? EMPTY_DASHBOARD_STATS);
          this.loading.set(false);
        }),
        catchError(() => {
          this.stats.set(EMPTY_DASHBOARD_STATS);
          this.error.set('Unable to load dashboard stats.');
          this.loading.set(false);
          return of(EMPTY_DASHBOARD_STATS);
        }),
      )
      .subscribe();
  }
}
