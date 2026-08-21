import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  RaceDayDto,
  ReportResultScope,
  ReportType,
  TournamentDto,
  TournamentRegistrationDetailDto,
} from '@kabootar/shared';

import { RegistrationService } from '../registrations/registration.service';
import { RaceDayService } from '../tournaments/race-day.service';
import { TournamentService } from '../tournaments/tournament.service';
import { ReportService } from './report.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  private readonly tournamentService = inject(TournamentService);
  private readonly raceDayService = inject(RaceDayService);
  private readonly reportService = inject(ReportService);
  private readonly registrationService = inject(RegistrationService);

  readonly reportTypes = ReportType;
  readonly resultScopes = ReportResultScope;

  readonly tournaments = signal<TournamentDto[]>([]);
  readonly raceDays = signal<RaceDayDto[]>([]);
  readonly registrations = signal<TournamentRegistrationDetailDto[]>([]);
  readonly selectedTournamentId = signal('');
  readonly selectedRaceDayId = signal('');
  readonly selectedParticipantId = signal('');
  readonly resultScope = signal<ReportResultScope>(ReportResultScope.COMPLETE);
  readonly downloading = signal<ReportType | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly canDownloadComplete = computed(() => !!this.selectedTournamentId());

  readonly canDownloadDailyResult = computed(
    () => !!this.selectedTournamentId() && !!this.selectedRaceDayId(),
  );

  readonly canDownloadParticipantResult = computed(
    () => !!this.selectedTournamentId() && !!this.selectedParticipantId(),
  );

  readonly canDownloadTournamentResult = computed(() => {
    if (!this.selectedTournamentId()) {
      return false;
    }

    if (this.resultScope() === ReportResultScope.DAILY) {
      return !!this.selectedRaceDayId();
    }

    if (this.resultScope() === ReportResultScope.PARTICIPANT) {
      return !!this.selectedParticipantId();
    }

    return true;
  });

  readonly canDownloadLandingTimes = computed(
    () => !!this.selectedTournamentId() && !!this.selectedRaceDayId(),
  );

  ngOnInit(): void {
    this.tournamentService.list({ limit: 100 }).subscribe({
      next: (response) => this.tournaments.set(response.items),
    });
  }

  onTournamentChange(tournamentId: string): void {
    this.selectedTournamentId.set(tournamentId);
    this.selectedRaceDayId.set('');
    this.selectedParticipantId.set('');
    this.raceDays.set([]);
    this.registrations.set([]);
    this.errorMessage.set(null);

    if (!tournamentId) {
      return;
    }

    this.raceDayService.listByTournament(tournamentId).subscribe({
      next: (items) => this.raceDays.set(items),
    });
    this.registrationService.list({ tournamentId, limit: 100 }).subscribe({
      next: (response) => this.registrations.set(response.items),
    });
  }

  onRaceDayChange(raceDayId: string): void {
    this.selectedRaceDayId.set(raceDayId);
    this.errorMessage.set(null);
  }

  onScopeChange(scope: ReportResultScope): void {
    this.resultScope.set(scope);
    this.errorMessage.set(null);
  }

  onParticipantChange(participantId: string): void {
    this.selectedParticipantId.set(participantId);
    this.errorMessage.set(null);
  }

  downloadReport(type: ReportType, scope?: ReportResultScope): void {
    if (scope) {
      this.resultScope.set(scope);
    }

    const tournamentId = this.selectedTournamentId();
    if (!tournamentId) {
      this.errorMessage.set('Select a tournament first.');
      return;
    }

    if (
      (type === ReportType.TOURNAMENT_RESULT &&
        this.resultScope() === ReportResultScope.DAILY &&
        !this.selectedRaceDayId()) ||
      (type === ReportType.TOURNAMENT_RESULT &&
        this.resultScope() === ReportResultScope.PARTICIPANT &&
        !this.selectedParticipantId()) ||
      (type === ReportType.LANDING_TIMES && !this.selectedRaceDayId())
    ) {
      this.errorMessage.set(
        this.resultScope() === ReportResultScope.PARTICIPANT
          ? 'Select a participant for this report.'
          : 'Select a race day for this report.',
      );
      return;
    }

    this.downloading.set(type);
    this.errorMessage.set(null);

    const request = this.buildDownloadRequest(type, tournamentId);
    request.subscribe({
      next: (blob) => {
        this.saveBlob(blob, this.buildFilename(type, tournamentId));
        this.downloading.set(null);
      },
      error: () => {
        this.errorMessage.set('Unable to download report. Please try again.');
        this.downloading.set(null);
      },
    });
  }

  isDownloading(type: ReportType): boolean {
    return this.downloading() === type;
  }

  private buildDownloadRequest(type: ReportType, tournamentId: string) {
    switch (type) {
      case ReportType.TOURNAMENT_RESULT:
        return this.reportService.downloadTournamentResult(
          tournamentId,
          this.resultScope(),
          this.resultScope() === ReportResultScope.DAILY ? this.selectedRaceDayId() : undefined,
          this.resultScope() === ReportResultScope.PARTICIPANT
            ? this.selectedParticipantId()
            : undefined,
        );
      case ReportType.PARTICIPANT_LIST:
        return this.reportService.downloadParticipantList(tournamentId);
      case ReportType.PAYMENTS:
        return this.reportService.downloadPaymentReport(tournamentId);
      case ReportType.PRIZES:
        return this.reportService.downloadPrizeReport(tournamentId);
      case ReportType.LANDING_TIMES:
        return this.reportService.downloadLandingTimeReport(tournamentId, this.selectedRaceDayId());
      default:
        throw new Error('Unsupported report type');
    }
  }

  private buildFilename(type: ReportType, tournamentId: string): string {
    const tournament = this.tournaments().find((item) => item.id === tournamentId);
    const slug = (tournament?.title ?? 'tournament')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    switch (type) {
      case ReportType.TOURNAMENT_RESULT:
        if (this.resultScope() === ReportResultScope.DAILY) {
          const raceDay = this.raceDays().find((item) => item.id === this.selectedRaceDayId());
          return `${slug}-${raceDay?.raceDate ?? 'daily'}-results.pdf`;
        }
        if (this.resultScope() === ReportResultScope.PARTICIPANT) {
          const registration = this.registrations().find(
            (item) => item.participantId === this.selectedParticipantId(),
          );
          const participantSlug = (registration?.participant?.name ?? 'participant')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          return `${slug}-${participantSlug}-results.pdf`;
        }
        return `${slug}-complete-results.pdf`;
      case ReportType.PARTICIPANT_LIST:
        return `${slug}-participants.xlsx`;
      case ReportType.PAYMENTS:
        return `${slug}-payments.xlsx`;
      case ReportType.PRIZES:
        return `${slug}-prizes.pdf`;
      case ReportType.LANDING_TIMES:
        return `${slug}-landing-times.xlsx`;
      default:
        return `${slug}-report`;
    }
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
