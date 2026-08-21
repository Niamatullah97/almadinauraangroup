import { Injectable, inject } from '@angular/core';
import { ReportResultScope } from '@kabootar/shared';
import { Observable } from 'rxjs';

import { ApiService } from '../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly api = inject(ApiService);

  downloadTournamentResult(
    tournamentId: string,
    scope: ReportResultScope,
    raceDayId?: string,
    participantId?: string,
  ): Observable<Blob> {
    const query: Record<string, string | undefined> = { scope, raceDayId };
    if (participantId) query['participantId'] = participantId;

    return this.api.download(`/tournaments/${tournamentId}/reports/tournament-result`, query);
  }

  downloadParticipantList(tournamentId: string): Observable<Blob> {
    return this.api.download(`/tournaments/${tournamentId}/reports/participant-list`);
  }

  downloadPaymentReport(tournamentId: string): Observable<Blob> {
    return this.api.download(`/tournaments/${tournamentId}/reports/payments`);
  }

  downloadPrizeReport(tournamentId: string): Observable<Blob> {
    return this.api.download(`/tournaments/${tournamentId}/reports/prizes`);
  }

  downloadLandingTimeReport(tournamentId: string, raceDayId: string): Observable<Blob> {
    return this.api.download(`/tournaments/${tournamentId}/reports/landing-times`, {
      raceDayId,
    });
  }
}
