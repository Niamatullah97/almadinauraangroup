import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TournamentDetailDto, UpdateTournamentRequest } from '@kabootar/shared';

import {
  TournamentFormComponent,
  TournamentFormSubmit,
} from './tournament-form.component';
import { TournamentService } from './tournament.service';

@Component({
  selector: 'app-tournament-edit',
  standalone: true,
  imports: [TournamentFormComponent],
  template: `
    @if (loading()) {
      <p class="state-message">Loading tournament...</p>
    } @else if (loadError()) {
      <p class="form-error state-message">{{ loadError() }}</p>
    } @else {
      <app-tournament-form
        [tournament]="tournament()"
        submitLabel="Save changes"
        [submitting]="submitting()"
        [submitError]="submitError()"
        (submitted)="onSubmit($event)"
        (cancelled)="onCancel()"
      />
    }
  `,
  styleUrls: ['./tournament-shared.scss', './tournament-list.component.scss'],
})
export class TournamentEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tournamentService = inject(TournamentService);

  readonly tournament = signal<TournamentDetailDto | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  private tournamentId = '';

  ngOnInit(): void {
    this.tournamentId = this.route.snapshot.paramMap.get('id') ?? '';
    this.tournamentService.getById(this.tournamentId).subscribe({
      next: (tournament) => {
        this.tournament.set(tournament);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load tournament.');
        this.loading.set(false);
      },
    });
  }

  onSubmit(event: TournamentFormSubmit): void {
    this.submitting.set(true);
    this.submitError.set(null);

    this.tournamentService
      .update(this.tournamentId, event.payload as UpdateTournamentRequest)
      .subscribe({
        next: (updated) => {
          if (event.bannerFile) {
            this.uploadBannerAndFinish(updated.id, event.bannerFile);
            return;
          }
          this.router.navigate(['/tournaments', updated.id]);
        },
        error: () => {
          this.submitError.set('Unable to update tournament. Please try again.');
          this.submitting.set(false);
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/tournaments', this.tournamentId]);
  }

  private uploadBannerAndFinish(id: string, file: File): void {
    this.tournamentService.uploadBanner(id, file).subscribe({
      next: () => this.router.navigate(['/tournaments', id]),
      error: () => {
        this.submitError.set('Changes saved, but banner upload failed.');
        this.submitting.set(false);
      },
    });
  }
}
