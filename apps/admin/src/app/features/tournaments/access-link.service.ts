import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  CreateAccessLinkRequest,
  CreatedTournamentAccessLinkDto,
  TournamentAccessLinkDto,
  TournamentAccessLinkListResponse,
  UnlockOrganizerRequest,
  OrganizerUnlockResponse,
} from '@kabootar/shared';

import { ApiService } from '../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class AccessLinkService {
  private readonly api = inject(ApiService);

  list(tournamentId: string): Observable<TournamentAccessLinkListResponse> {
    return this.api
      .get<TournamentAccessLinkListResponse>(`/tournaments/${tournamentId}/access-links`)
      .pipe(map((response) => response.data ?? { items: [], total: 0 }));
  }

  create(
    tournamentId: string,
    payload: CreateAccessLinkRequest,
  ): Observable<CreatedTournamentAccessLinkDto> {
    return this.api
      .post<CreatedTournamentAccessLinkDto>(`/tournaments/${tournamentId}/access-links`, payload)
      .pipe(map((response) => response.data as CreatedTournamentAccessLinkDto));
  }

  revoke(tournamentId: string, linkId: string): Observable<TournamentAccessLinkDto> {
    return this.api
      .delete<TournamentAccessLinkDto>(`/tournaments/${tournamentId}/access-links/${linkId}`)
      .pipe(map((response) => response.data as TournamentAccessLinkDto));
  }

  unlock(payload: UnlockOrganizerRequest): Observable<OrganizerUnlockResponse> {
    return this.api
      .post<OrganizerUnlockResponse>('/organizer/unlock', payload)
      .pipe(map((response) => response.data as OrganizerUnlockResponse));
  }
}
