import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  CreateTournamentRequest,
  PaginatedQuery,
  TournamentDetailDto,
  TournamentDto,
  TournamentListResponse,
  TournamentStatus,
  UpdateTournamentRequest,
} from '@kabootar/shared';

import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

export interface TournamentQuery extends PaginatedQuery {
  status?: TournamentStatus;
}

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private readonly api = inject(ApiService);

  list(query: TournamentQuery = {}): Observable<TournamentListResponse> {
    return this.api
      .get<TournamentListResponse>('/tournaments', query)
      .pipe(map((response) => response.data ?? { items: [], total: 0, page: 1, limit: 20, totalPages: 0 }));
  }

  getById(id: string): Observable<TournamentDetailDto> {
    return this.api
      .get<TournamentDetailDto>(`/tournaments/${id}`)
      .pipe(map((response) => response.data as TournamentDetailDto));
  }

  create(payload: CreateTournamentRequest): Observable<TournamentDto> {
    return this.api
      .post<TournamentDto>('/tournaments', payload)
      .pipe(map((response) => response.data as TournamentDto));
  }

  update(id: string, payload: UpdateTournamentRequest): Observable<TournamentDetailDto> {
    return this.api
      .patch<TournamentDetailDto>(`/tournaments/${id}`, payload)
      .pipe(map((response) => response.data as TournamentDetailDto));
  }

  delete(id: string): Observable<TournamentDto> {
    return this.api
      .delete<TournamentDto>(`/tournaments/${id}`)
      .pipe(map((response) => response.data as TournamentDto));
  }

  uploadBanner(id: string, file: File): Observable<TournamentDto> {
    return this.api
      .upload<TournamentDto>(`/tournaments/${id}/banner`, file)
      .pipe(map((response) => response.data as TournamentDto));
  }

  resolveBannerUrl(bannerImage: string | null | undefined): string | null {
    if (!bannerImage) return null;
    if (bannerImage.startsWith('http')) return bannerImage;
    const base = environment.uploadsUrl.replace(/\/$/, '');
    const path = bannerImage.startsWith('/') ? bannerImage : `/${bannerImage}`;
    return `${base}${path}`;
  }
}
