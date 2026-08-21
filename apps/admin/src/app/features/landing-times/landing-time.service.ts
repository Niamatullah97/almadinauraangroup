import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  BulkSaveLandingTimesRequest,
  BulkSaveLandingTimesResponse,
  CreateLandingTimeRequest,
  LandingTimeEntrySheetResponse,
  LandingTimeListResponse,
  PigeonLandingTimeDto,
  UpdateLandingTimeRequest,
} from '@kabootar/shared';

import { ApiService } from '../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class LandingTimeService {
  private readonly api = inject(ApiService);

  getEntrySheet(
    tournamentId: string,
    raceDayId: string,
    participantId?: string,
  ): Observable<LandingTimeEntrySheetResponse> {
    return this.api
      .get<LandingTimeEntrySheetResponse>(
        `/tournaments/${tournamentId}/race-days/${raceDayId}/landing-times/entry-sheet`,
        { participantId },
      )
      .pipe(map((response) => response.data as LandingTimeEntrySheetResponse));
  }

  list(
    tournamentId: string,
    raceDayId: string,
    participantId?: string,
  ): Observable<LandingTimeListResponse> {
    return this.api
      .get<LandingTimeListResponse>(
        `/tournaments/${tournamentId}/race-days/${raceDayId}/landing-times`,
        { participantId },
      )
      .pipe(
        map(
          (response) => response.data ?? { items: [], total: 0 },
        ),
      );
  }

  create(
    tournamentId: string,
    raceDayId: string,
    payload: CreateLandingTimeRequest,
  ): Observable<PigeonLandingTimeDto> {
    return this.api
      .post<PigeonLandingTimeDto>(
        `/tournaments/${tournamentId}/race-days/${raceDayId}/landing-times`,
        payload,
      )
      .pipe(map((response) => response.data as PigeonLandingTimeDto));
  }

  bulkSave(
    tournamentId: string,
    raceDayId: string,
    payload: BulkSaveLandingTimesRequest,
  ): Observable<BulkSaveLandingTimesResponse> {
    return this.api
      .post<BulkSaveLandingTimesResponse>(
        `/tournaments/${tournamentId}/race-days/${raceDayId}/landing-times/bulk`,
        payload,
      )
      .pipe(map((response) => response.data as BulkSaveLandingTimesResponse));
  }

  update(
    tournamentId: string,
    raceDayId: string,
    id: string,
    payload: UpdateLandingTimeRequest,
  ): Observable<PigeonLandingTimeDto> {
    return this.api
      .patch<PigeonLandingTimeDto>(
        `/tournaments/${tournamentId}/race-days/${raceDayId}/landing-times/${id}`,
        payload,
      )
      .pipe(map((response) => response.data as PigeonLandingTimeDto));
  }
}
