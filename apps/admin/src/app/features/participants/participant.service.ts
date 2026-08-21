import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  CreateParticipantRequest,
  ParticipantDto,
  ParticipantListResponse,
  ParticipantQuery,
  UpdateParticipantRequest,
} from '@kabootar/shared';

import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ParticipantService {
  private readonly api = inject(ApiService);

  list(query: ParticipantQuery = {}): Observable<ParticipantListResponse> {
    return this.api
      .get<ParticipantListResponse>('/participants', query)
      .pipe(
        map(
          (response) =>
            response.data ?? { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
        ),
      );
  }

  listCities(): Observable<string[]> {
    return this.api
      .get<string[]>('/participants/cities')
      .pipe(map((response) => response.data ?? []));
  }

  getById(id: string): Observable<ParticipantDto> {
    return this.api
      .get<ParticipantDto>(`/participants/${id}`)
      .pipe(map((response) => response.data as ParticipantDto));
  }

  create(payload: CreateParticipantRequest): Observable<ParticipantDto> {
    return this.api
      .post<ParticipantDto>('/participants', payload)
      .pipe(map((response) => response.data as ParticipantDto));
  }

  update(id: string, payload: UpdateParticipantRequest): Observable<ParticipantDto> {
    return this.api
      .patch<ParticipantDto>(`/participants/${id}`, payload)
      .pipe(map((response) => response.data as ParticipantDto));
  }

  delete(id: string): Observable<ParticipantDto> {
    return this.api
      .delete<ParticipantDto>(`/participants/${id}`)
      .pipe(map((response) => response.data as ParticipantDto));
  }

  uploadProfile(id: string, file: File): Observable<ParticipantDto> {
    return this.api
      .upload<ParticipantDto>(`/participants/${id}/profile`, file, 'profile')
      .pipe(map((response) => response.data as ParticipantDto));
  }

  resolveProfileUrl(profileImage: string | null | undefined): string | null {
    if (!profileImage) return null;
    if (profileImage.startsWith('http')) return profileImage;
    const base = environment.uploadsUrl.replace(/\/$/, '');
    const path = profileImage.startsWith('/') ? profileImage : `/${profileImage}`;
    return `${base}${path}`;
  }

  getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
}
