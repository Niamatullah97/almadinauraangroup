import { Component, OnDestroy, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LandingTimeEntrySheetResponse,
  RACE_DAY_STATUS_LABELS,
  RaceDayDto,
  RaceDayStatus,
  TournamentDto,
  clockTimeToSeconds,
  formatClockHms,
  formatTypedClockTime,
  normalizeLandingTimeInput,
} from '@kabootar/shared';

import { ParticipantService } from '../participants/participant.service';
import { RaceDayService } from '../tournaments/race-day.service';
import { TournamentService } from '../tournaments/tournament.service';
import { LandingTimeService } from './landing-time.service';

interface EntryCell {
  key: string;
  participantId: string;
  registrationPigeonId: string;
  pigeonNumber: number;
  landingTime: string;
  isDoubleStamp: boolean;
  error: string | null;
}

interface ParticipantEntryRow {
  participantId: string;
  participantName: string;
  loftName: string;
  profileImage: string | null;
  photoFailed: boolean;
  cells: Array<EntryCell | null>;
}

@Component({
  selector: 'app-landing-time-entry',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="landing-entry">
      <div class="page-toolbar">
        <div>
          <h2 class="landing-entry__title">Landing time entry</h2>
          <p class="landing-entry__subtitle">
            Type each pigeon’s landing time as HH:mm:ss. Enter moves to the next pigeon; Total
            updates as a running cumulative.
          </p>
        </div>
        <div class="page-toolbar__actions">
          <label class="auto-save-toggle">
            <input type="checkbox" [(ngModel)]="autoSave" />
            Auto-save on blur
          </label>
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="!canSave() || saving()"
            (click)="saveAll()"
          >
            {{ saving() ? 'Saving...' : 'Save all' }}
          </button>
        </div>
      </div>

      <div class="filters-card">
        <div class="filters-grid">
          @if (!lockedTournamentId()) {
            <div class="form-field">
              <label class="form-label" for="tournament">Tournament</label>
              <select
                id="tournament"
                class="form-control"
                [ngModel]="selectedTournamentId()"
                (ngModelChange)="onTournamentChange($event)"
              >
                <option value="">Select tournament</option>
                @for (tournament of tournaments(); track tournament.id) {
                  <option [value]="tournament.id">
                    {{ tournament.title }} · {{ tournament.city }}
                  </option>
                }
              </select>
            </div>
          }

          <div class="form-field">
            <label class="form-label" for="raceDay">Race day</label>
            <select
              id="raceDay"
              class="form-control"
              [disabled]="!selectedTournamentId()"
              [ngModel]="selectedRaceDayId()"
              (ngModelChange)="onRaceDayChange($event)"
            >
              <option value="">Select race day</option>
              @for (raceDay of raceDays(); track raceDay.id) {
                <option [value]="raceDay.id">
                  {{ raceDay.raceDate }} · {{ statusLabels[raceDay.status] }}
                </option>
              }
            </select>
          </div>

          <div class="form-field">
            <label class="form-label" for="participant">Participant</label>
            <select
              id="participant"
              class="form-control"
              [disabled]="!selectedRaceDayId()"
              [ngModel]="selectedParticipantId()"
              (ngModelChange)="onParticipantChange($event)"
            >
              <option value="">All participants</option>
              @for (participant of participantOptions(); track participant.id) {
                <option [value]="participant.id">
                  {{ participant.name }} · {{ participant.loftName }}
                </option>
              }
            </select>
          </div>
        </div>

        @if (entrySheet()) {
          <p class="form-hint landing-entry__meta">
            Race date {{ entrySheet()!.raceDate }} · Start {{ entrySheet()!.releaseTime }} · End
            {{ entrySheet()!.endTime }} · Status {{ statusLabels[entrySheet()!.status] }} · Pigeons
            1–{{ entrySheet()!.pigeonCount }}
          </p>
        }

        @if (!requireLiveRaceDay() && entrySheet()?.status === pendingStatus) {
          <p class="form-error">Landing times can only be entered while the race day is Live.</p>
        }
        @if (requireLiveRaceDay() && entrySheet() && entrySheet()!.status !== liveStatus) {
          <p class="form-error">
            Landing times can only be entered after the race day has started.
          </p>
        }
      </div>

      <div class="table-card landing-entry__sheet">
        @if (loading()) {
          <p class="state-message">Loading entry sheet...</p>
        } @else if (error()) {
          <p class="form-error state-message">{{ error() }}</p>
        } @else if (!selectedRaceDayId()) {
          <p class="state-message">Select a tournament and race day to begin entry.</p>
        } @else if (participantRows().length === 0) {
          <p class="state-message">No participants registered for this tournament yet.</p>
        } @else {
          <table class="data-table landing-entry__table">
            <thead>
              <tr>
                <th class="landing-entry__sticky">Sr</th>
                <th class="landing-entry__sticky landing-entry__sticky--picture">Picture</th>
                <th class="landing-entry__sticky landing-entry__sticky--name">Name</th>
                @for (pigeonNumber of pigeonColumns(); track pigeonNumber) {
                  <th>Pigeon {{ pigeonNumber }}</th>
                }
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              @for (row of participantRows(); track row.participantId; let index = $index) {
                <tr [class.landing-entry__row--error]="hasRowError(row)">
                  <td class="landing-entry__sticky">{{ index + 1 }}</td>
                  <td class="landing-entry__sticky landing-entry__sticky--picture">
                    @if (showPhoto(row); as imageUrl) {
                      <img
                        [src]="imageUrl"
                        [alt]="row.participantName"
                        class="landing-entry__avatar"
                        (error)="onPhotoError(row)"
                      />
                    } @else {
                      <span class="landing-entry__avatar landing-entry__avatar--placeholder">
                        {{ initials(row.participantName) }}
                      </span>
                    }
                  </td>
                  <td class="landing-entry__sticky landing-entry__sticky--name">
                    <strong>{{ row.participantName }}</strong>
                    <span class="table-subtext">{{ row.loftName }}</span>
                  </td>
                  @for (cell of row.cells; track $index) {
                    <td class="landing-entry__pigeon-cell">
                      @if (cell) {
                        <div
                          class="landing-entry__cell"
                          [class.landing-entry__cell--error]="cell.error"
                        >
                          <input
                            type="text"
                            inputmode="numeric"
                            maxlength="8"
                            placeholder="00:00:00"
                            class="form-control landing-entry__time-input"
                            [class.is-invalid]="cell.error"
                            [disabled]="!canEnterTimes()"
                            [ngModel]="cell.landingTime"
                            (ngModelChange)="onTimeChange(cell, $event)"
                            (keydown.enter)="focusNextCell($event)"
                            (blur)="onCellBlur(cell)"
                          />
                          @if (cellFlightTime(cell); as flightTime) {
                            <span class="landing-entry__cumulative">{{ flightTime }}</span>
                          }
                          @if (doubleStampEnabled()) {
                            <label
                              class="landing-entry__stamp-badge"
                              [class.landing-entry__stamp-badge--on]="cell.isDoubleStamp"
                            >
                              <input
                                type="checkbox"
                                [disabled]="!canEnterTimes()"
                                [(ngModel)]="cell.isDoubleStamp"
                                (change)="onStampChange(cell)"
                              />
                              Double stamp
                            </label>
                          }
                          @if (cell.error) {
                            <p class="form-error">{{ cell.error }}</p>
                          }
                        </div>
                      } @else {
                        <span class="landing-entry__empty">—</span>
                      }
                    </td>
                  }
                  <td class="landing-entry__total">{{ rowTotal(row) }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      @if (saveMessage()) {
        <p class="landing-entry__save-message">{{ saveMessage() }}</p>
      }
    </section>
  `,
  styleUrls: [
    '../tournaments/tournament-shared.scss',
    '../tournaments/tournament-list.component.scss',
    './landing-time-entry.component.scss',
  ],
})
export class LandingTimeEntryComponent implements OnInit, OnDestroy {
  private readonly tournamentService = inject(TournamentService);
  private readonly raceDayService = inject(RaceDayService);
  private readonly landingTimeService = inject(LandingTimeService);
  private readonly participantService = inject(ParticipantService);

  readonly lockedTournamentId = input<string | null>(null);
  readonly requireLiveRaceDay = input(false);

  readonly statusLabels = RACE_DAY_STATUS_LABELS;
  readonly pendingStatus = RaceDayStatus.PENDING;
  readonly liveStatus = RaceDayStatus.LIVE;

  readonly tournaments = signal<TournamentDto[]>([]);
  readonly raceDays = signal<RaceDayDto[]>([]);
  readonly participantOptions = signal<{ id: string; name: string; loftName: string }[]>([]);
  readonly entrySheet = signal<LandingTimeEntrySheetResponse | null>(null);
  readonly participantRows = signal<ParticipantEntryRow[]>([]);
  readonly pigeonColumns = signal<number[]>([]);
  readonly selectedTournamentId = signal('');
  readonly selectedRaceDayId = signal('');
  readonly selectedParticipantId = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveMessage = signal<string | null>(null);
  private readonly currentTime = signal(Date.now());
  private clockTimer: ReturnType<typeof setInterval> | null = null;

  autoSave = false;

  ngOnInit(): void {
    this.clockTimer = setInterval(() => this.currentTime.set(Date.now()), 1000);

    const lockedId = this.lockedTournamentId();
    if (lockedId) {
      this.onTournamentChange(lockedId);
      return;
    }

    this.tournamentService.list({ limit: 100 }).subscribe({
      next: (response) => this.tournaments.set(response.items),
      error: () => this.error.set('Unable to load tournaments.'),
    });
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  }

  onTournamentChange(tournamentId: string): void {
    this.selectedTournamentId.set(tournamentId);
    this.selectedRaceDayId.set('');
    this.selectedParticipantId.set('');
    this.entrySheet.set(null);
    this.participantRows.set([]);
    this.pigeonColumns.set([]);
    this.raceDays.set([]);
    this.participantOptions.set([]);

    if (!tournamentId) return;

    this.raceDayService.listByTournament(tournamentId).subscribe({
      next: (items) => this.raceDays.set(items),
      error: () => this.error.set('Unable to load race days.'),
    });
  }

  onRaceDayChange(raceDayId: string): void {
    this.selectedRaceDayId.set(raceDayId);
    this.selectedParticipantId.set('');
    this.loadEntrySheet();
  }

  onParticipantChange(participantId: string): void {
    this.selectedParticipantId.set(participantId);
    this.loadEntrySheet();
  }

  canSave(): boolean {
    const sheet = this.entrySheet();
    return !!sheet && this.canEnterTimes() && this.allCells().some((cell) => cell.landingTime);
  }

  canEnterTimes(): boolean {
    const sheet = this.entrySheet();
    if (!sheet) return false;
    if (sheet.status !== RaceDayStatus.LIVE) return false;

    const startsAt = this.raceDayDateTime(sheet.raceDate, sheet.releaseTime);
    const endsAt = this.raceDayDateTime(sheet.raceDate, sheet.endTime);
    const now = this.currentTime();
    return now >= startsAt.getTime() && now <= endsAt.getTime();
  }

  doubleStampEnabled(): boolean {
    return this.entrySheet()?.doubleStampEnabled ?? false;
  }

  profileUrl(profileImage: string | null): string | null {
    return this.participantService.resolveProfileUrl(profileImage);
  }

  showPhoto(row: ParticipantEntryRow): string | null {
    if (row.photoFailed) return null;
    return this.profileUrl(row.profileImage);
  }

  onPhotoError(row: ParticipantEntryRow): void {
    row.photoFailed = true;
  }

  initials(name: string): string {
    return this.participantService.getInitials(name);
  }

  rowTotal(row: ParticipantEntryRow): string {
    const totalSeconds = row.cells.reduce(
      (sum, cell) => sum + (cell ? (this.flightSeconds(cell.landingTime) ?? 0) : 0),
      0,
    );
    return totalSeconds > 0 ? formatClockHms(totalSeconds) : '—';
  }

  cellFlightTime(cell: EntryCell): string | null {
    const seconds = this.flightSeconds(cell.landingTime);
    return seconds === null ? null : formatClockHms(seconds);
  }

  hasRowError(row: ParticipantEntryRow): boolean {
    return row.cells.some((cell) => cell?.error);
  }

  onTimeChange(cell: EntryCell, value: string): void {
    cell.landingTime = formatTypedClockTime(value);
    cell.error = null;
  }

  focusNextCell(event: Event): void {
    event.preventDefault();
    const current = event.target as HTMLInputElement;
    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement>('.landing-entry__time-input'),
    );
    const index = inputs.indexOf(current);
    inputs[index + 1]?.focus();
  }

  onCellBlur(cell: EntryCell): void {
    const trimmed = cell.landingTime.trim();
    if (!trimmed) {
      cell.error = null;
      return;
    }

    try {
      cell.landingTime = normalizeLandingTimeInput(trimmed);
      cell.error = this.landingWindowError(cell.landingTime);
    } catch {
      cell.error = 'Use HH:mm:ss';
      return;
    }

    if (cell.error) return;
    if (!this.autoSave) return;
    this.saveCells([cell], true);
  }

  onStampChange(cell: EntryCell): void {
    if (!this.autoSave || !cell.landingTime.trim()) return;
    this.saveCells([cell], true);
  }

  saveAll(): void {
    const cellsToSave = this.allCells().filter((cell) => {
      try {
        if (!cell.landingTime.trim()) return false;
        cell.landingTime = normalizeLandingTimeInput(cell.landingTime);
        cell.error = this.landingWindowError(cell.landingTime);
        return cell.error === null;
      } catch {
        cell.error = 'Use HH:mm:ss';
        return false;
      }
    });
    this.saveCells(cellsToSave, false);
  }

  private loadEntrySheet(): void {
    const tournamentId = this.selectedTournamentId();
    const raceDayId = this.selectedRaceDayId();
    if (!tournamentId || !raceDayId) return;

    this.loading.set(true);
    this.error.set(null);
    this.saveMessage.set(null);

    this.landingTimeService
      .getEntrySheet(tournamentId, raceDayId, this.selectedParticipantId() || undefined)
      .subscribe({
        next: (sheet) => {
          this.entrySheet.set(sheet);
          this.participantOptions.set(
            sheet.participants.map((participant) => ({
              id: participant.participantId,
              name: participant.participantName,
              loftName: participant.loftName,
            })),
          );
          this.pigeonColumns.set(
            Array.from({ length: sheet.pigeonCount }, (_, index) => index + 1),
          );
          this.participantRows.set(this.buildParticipantRows(sheet));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Unable to load landing time entry sheet.');
          this.loading.set(false);
        },
      });
  }

  private buildParticipantRows(sheet: LandingTimeEntrySheetResponse): ParticipantEntryRow[] {
    return sheet.participants.map((participant) => {
      const byNumber = new Map(
        participant.pigeons.map((pigeon) => [
          pigeon.pigeonNumber,
          {
            key: `${participant.participantId}-${pigeon.registrationPigeonId}`,
            participantId: participant.participantId,
            registrationPigeonId: pigeon.registrationPigeonId,
            pigeonNumber: pigeon.pigeonNumber,
            landingTime: pigeon.landingTime ?? '',
            isDoubleStamp: pigeon.isDoubleStamp,
            error: null,
          } satisfies EntryCell,
        ]),
      );

      return {
        participantId: participant.participantId,
        participantName: participant.participantName,
        loftName: participant.loftName,
        profileImage: participant.profileImage,
        photoFailed: false,
        cells: Array.from(
          { length: sheet.pigeonCount },
          (_, index) => byNumber.get(index + 1) ?? null,
        ),
      };
    });
  }

  private allCells(): EntryCell[] {
    return this.participantRows().flatMap((row) =>
      row.cells.filter((cell): cell is EntryCell => cell !== null),
    );
  }

  private flightSeconds(landingTime: string): number | null {
    const sheet = this.entrySheet();
    const startSeconds = sheet ? clockTimeToSeconds(sheet.releaseTime) : null;
    const landingSeconds = clockTimeToSeconds(landingTime);
    if (startSeconds === null || landingSeconds === null || landingSeconds < startSeconds) {
      return null;
    }
    return landingSeconds - startSeconds;
  }

  private landingWindowError(landingTime: string): string | null {
    const sheet = this.entrySheet();
    if (!sheet) return null;

    const landingSeconds = clockTimeToSeconds(landingTime);
    const startSeconds = clockTimeToSeconds(sheet.releaseTime);
    const endSeconds = clockTimeToSeconds(sheet.endTime);
    if (landingSeconds === null || startSeconds === null || endSeconds === null) {
      return 'Use HH:mm:ss';
    }
    if (landingSeconds < startSeconds) {
      return `Time must be at or after ${sheet.releaseTime}`;
    }
    if (landingSeconds > endSeconds) {
      return `Time must be at or before ${sheet.endTime}`;
    }
    return null;
  }

  private raceDayDateTime(raceDate: string, time: string): Date {
    const [year, month, day] = raceDate.split('-').map(Number);
    const [hours, minutes, seconds = 0] = time.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  private saveCells(cellsToSave: EntryCell[], silent: boolean): void {
    const tournamentId = this.selectedTournamentId();
    const raceDayId = this.selectedRaceDayId();
    if (!tournamentId || !raceDayId || cellsToSave.length === 0) return;

    this.saving.set(true);
    this.saveMessage.set(null);
    this.clearCellErrors();

    this.landingTimeService
      .bulkSave(tournamentId, raceDayId, {
        entries: cellsToSave.map((cell) => ({
          participantId: cell.participantId,
          registrationPigeonId: cell.registrationPigeonId,
          landingTime: cell.landingTime,
          ...(this.doubleStampEnabled() && { isDoubleStamp: cell.isDoubleStamp }),
        })),
      })
      .subscribe({
        next: (response) => {
          this.applyBulkErrors(response.errors);
          if (!silent) {
            this.saveMessage.set(`Saved ${response.saved.length} landing time(s).`);
          }
          this.saving.set(false);
          if (response.errors.length === 0) {
            this.loadEntrySheet();
          }
        },
        error: (err) => {
          this.error.set(this.extractErrorMessage(err));
          this.saving.set(false);
        },
      });
  }

  private applyBulkErrors(errors: { registrationPigeonId: string; message: string }[]): void {
    if (errors.length === 0) return;

    const errorMap = new Map(errors.map((item) => [item.registrationPigeonId, item.message]));
    this.participantRows.update((rows) =>
      rows.map((row) => ({
        ...row,
        cells: row.cells.map((cell) =>
          cell ? { ...cell, error: errorMap.get(cell.registrationPigeonId) ?? cell.error } : cell,
        ),
      })),
    );
  }

  private clearCellErrors(): void {
    this.participantRows.update((rows) =>
      rows.map((row) => ({
        ...row,
        cells: row.cells.map((cell) => (cell ? { ...cell, error: null } : cell)),
      })),
    );
  }

  private extractErrorMessage(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error?: { message?: string } }).error?.message === 'string'
    ) {
      return (error as { error: { message: string } }).error.message;
    }

    return 'Unable to save landing times.';
  }
}
