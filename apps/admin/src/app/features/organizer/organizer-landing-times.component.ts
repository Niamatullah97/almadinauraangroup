import { Component, inject } from '@angular/core';

import { OrganizerSessionService } from '../../core/services/organizer-session.service';
import { LandingTimeEntryComponent } from '../landing-times/landing-time-entry.component';

@Component({
  selector: 'app-organizer-landing-times',
  standalone: true,
  imports: [LandingTimeEntryComponent],
  template: `
    @if (tournamentId) {
      <app-landing-time-entry [lockedTournamentId]="tournamentId" [requireLiveRaceDay]="true" />
    }
  `,
})
export class OrganizerLandingTimesComponent {
  private readonly organizerSession = inject(OrganizerSessionService);
  readonly tournamentId = this.organizerSession.getTournament()?.id ?? null;
}
