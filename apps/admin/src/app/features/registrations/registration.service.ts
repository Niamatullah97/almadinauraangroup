import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  CreateRegistrationRequest,
  FeePreviewResponse,
  RecordPaymentRequest,
  RegistrationListResponse,
  RegistrationQuery,
  TournamentRegistrationDetailDto,
  UpdateRegistrationRequest,
} from '@kabootar/shared';

import { ApiService } from '../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly api = inject(ApiService);

  list(query: RegistrationQuery = {}): Observable<RegistrationListResponse> {
    return this.api
      .get<RegistrationListResponse>('/registrations', query)
      .pipe(
        map(
          (response) =>
            response.data ?? { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
        ),
      );
  }

  getById(id: string): Observable<TournamentRegistrationDetailDto> {
    return this.api
      .get<TournamentRegistrationDetailDto>(`/registrations/${id}`)
      .pipe(map((response) => response.data as TournamentRegistrationDetailDto));
  }

  create(payload: CreateRegistrationRequest): Observable<TournamentRegistrationDetailDto> {
    return this.api
      .post<TournamentRegistrationDetailDto>('/registrations', payload)
      .pipe(map((response) => response.data as TournamentRegistrationDetailDto));
  }

  update(
    id: string,
    payload: UpdateRegistrationRequest,
  ): Observable<TournamentRegistrationDetailDto> {
    return this.api
      .patch<TournamentRegistrationDetailDto>(`/registrations/${id}`, payload)
      .pipe(map((response) => response.data as TournamentRegistrationDetailDto));
  }

  recordPayment(
    id: string,
    payload: RecordPaymentRequest,
  ): Observable<TournamentRegistrationDetailDto> {
    return this.api
      .post<TournamentRegistrationDetailDto>(`/registrations/${id}/payments`, payload)
      .pipe(map((response) => response.data as TournamentRegistrationDetailDto));
  }

  delete(id: string): Observable<TournamentRegistrationDetailDto> {
    return this.api
      .delete<TournamentRegistrationDetailDto>(`/registrations/${id}`)
      .pipe(map((response) => response.data as TournamentRegistrationDetailDto));
  }

  previewFee(
    tournamentId: string,
    pigeonCount: number,
    excludeRegistrationId?: string,
  ): Observable<FeePreviewResponse> {
    return this.api
      .get<FeePreviewResponse>(`/tournaments/${tournamentId}/registrations/fee-preview`, {
        pigeonCount,
        excludeRegistrationId,
      })
      .pipe(map((response) => response.data as FeePreviewResponse));
  }
}
