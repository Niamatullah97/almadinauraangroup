import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CreateTournamentRequest } from '@kabootar/shared';

import {
  TournamentFormComponent,
  TournamentFormSubmit,
} from './tournament-form.component';
import { TournamentService } from './tournament.service';

@Component({
  selector: 'app-tournament-create',
  standalone: true,
  imports: [TournamentFormComponent],
  template: `
    <app-tournament-form
      submitLabel="Create tournament"
      [submitting]="submitting()"
      [submitError]="submitError()"
      (submitted)="onSubmit($event)"
      (cancelled)="onCancel()"
    />
  `,
})
export class TournamentCreateComponent {
  private readonly tournamentService = inject(TournamentService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  onSubmit(event: TournamentFormSubmit): void {
    this.submitting.set(true);
    this.submitError.set(null);

    this.tournamentService.create(event.payload as CreateTournamentRequest).subscribe({
      next: (tournament) => {
        if (event.bannerFile) {
          this.uploadBannerAndRedirect(tournament.id, event.bannerFile);
          return;
        }
        this.router.navigate(['/tournaments', tournament.id]);
      },
      error: () => {
        this.submitError.set('Unable to create tournament. Please review the form and try again.');
        this.submitting.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/tournaments']);
  }

  private uploadBannerAndRedirect(id: string, file: File): void {
    this.tournamentService.uploadBanner(id, file).subscribe({
      next: () => this.router.navigate(['/tournaments', id]),
      error: () => {
        this.submitError.set('Tournament created, but banner upload failed. You can retry from edit.');
        this.submitting.set(false);
        this.router.navigate(['/tournaments', id, 'edit']);
      },
    });
  }
}
