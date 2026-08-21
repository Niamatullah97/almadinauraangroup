import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  BulkGeneratePigeonsRequest,
  BulkGeneratePigeonsResponse,
  CreateRegistrationPigeonRequest,
  RegistrationPigeonDto,
  RegistrationPigeonListResponse,
  UpdateRegistrationPigeonRequest,
} from '@kabootar/shared';

import { ApiService } from '../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class RegistrationPigeonService {
  private readonly api = inject(ApiService);

  list(registrationId: string): Observable<RegistrationPigeonListResponse> {
    return this.api
      .get<RegistrationPigeonListResponse>(`/registrations/${registrationId}/pigeons`)
      .pipe(
        map(
          (response) =>
            response.data ?? {
              items: [],
              assignedCount: 0,
              registeredCount: 0,
              remainingCount: 0,
            },
        ),
      );
  }

  create(
    registrationId: string,
    payload: CreateRegistrationPigeonRequest,
  ): Observable<RegistrationPigeonDto> {
    return this.api
      .post<RegistrationPigeonDto>(`/registrations/${registrationId}/pigeons`, payload)
      .pipe(map((response) => response.data as RegistrationPigeonDto));
  }

  bulkGenerate(
    registrationId: string,
    payload: BulkGeneratePigeonsRequest = {},
  ): Observable<BulkGeneratePigeonsResponse> {
    return this.api
      .post<BulkGeneratePigeonsResponse>(
        `/registrations/${registrationId}/pigeons/bulk-generate`,
        payload,
      )
      .pipe(map((response) => response.data as BulkGeneratePigeonsResponse));
  }

  update(
    registrationId: string,
    pigeonId: string,
    payload: UpdateRegistrationPigeonRequest,
  ): Observable<RegistrationPigeonDto> {
    return this.api
      .patch<RegistrationPigeonDto>(
        `/registrations/${registrationId}/pigeons/${pigeonId}`,
        payload,
      )
      .pipe(map((response) => response.data as RegistrationPigeonDto));
  }

  toggleDoubleStamp(
    registrationId: string,
    pigeonId: string,
  ): Observable<RegistrationPigeonDto> {
    return this.api
      .patch<RegistrationPigeonDto>(
        `/registrations/${registrationId}/pigeons/${pigeonId}/double-stamp`,
        {},
      )
      .pipe(map((response) => response.data as RegistrationPigeonDto));
  }

  delete(registrationId: string, pigeonId: string): Observable<RegistrationPigeonDto> {
    return this.api
      .delete<RegistrationPigeonDto>(`/registrations/${registrationId}/pigeons/${pigeonId}`)
      .pipe(map((response) => response.data as RegistrationPigeonDto));
  }
}
