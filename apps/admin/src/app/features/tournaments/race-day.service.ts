import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  CreateRaceDayRequest,
  RaceDayDto,
  UpdateRaceDayRequest,
} from '@kabootar/shared';

import { ApiService } from '../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class RaceDayService {
  private readonly api = inject(ApiService);

  listByTournament(tournamentId: string): Observable<RaceDayDto[]> {
    return this.api
      .get<RaceDayDto[]>(`/tournaments/${tournamentId}/race-days`)
      .pipe(map((response) => response.data ?? []));
  }

  create(tournamentId: string, payload: CreateRaceDayRequest): Observable<RaceDayDto> {
    return this.api
      .post<RaceDayDto>(`/tournaments/${tournamentId}/race-days`, payload)
      .pipe(map((response) => response.data as RaceDayDto));
  }

  update(
    tournamentId: string,
    raceDayId: string,
    payload: UpdateRaceDayRequest,
  ): Observable<RaceDayDto> {
    return this.api
      .patch<RaceDayDto>(`/tournaments/${tournamentId}/race-days/${raceDayId}`, payload)
      .pipe(map((response) => response.data as RaceDayDto));
  }

  delete(tournamentId: string, raceDayId: string): Observable<RaceDayDto> {
    return this.api
      .delete<RaceDayDto>(`/tournaments/${tournamentId}/race-days/${raceDayId}`)
      .pipe(map((response) => response.data as RaceDayDto));
  }
}
