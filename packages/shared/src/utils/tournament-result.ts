import { RaceDayStatus } from '../types/race-day';
import { TournamentStatus } from '../types/tournament';
import {
  DailyResultDto,
  DoubleStampResultDto,
  ParticipantResultRow,
  RacingWindow,
  ResultCalculationOptions,
  ResultPigeonLandingInput,
  ResultPigeonRow,
  ResultRaceDayInput,
  ResultSummaryCounts,
  ResultWinner,
  TotalResultDto,
  TournamentResultInput,
  TournamentResultPigeonInput,
} from '../types/tournament-result';
import { formatLandingTimeForInput } from './landing-time';

export function combineReleaseDateTime(raceDate: string, releaseTime: string): Date {
  const [year, month, day] = raceDate.split('-').map(Number);
  const [hours, minutes] = releaseTime.split(':').map(Number);
  const release = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (Number.isNaN(release.getTime())) {
    throw new Error('Invalid race release date/time');
  }

  return release;
}

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatClockDuration(ms: number, withSeconds = true): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  if (!withSeconds) {
    return clock;
  }

  return `${clock}:${String(seconds).padStart(2, '0')}`;
}

export function calculateFlightDurationMs(
  raceDate: string,
  releaseTime: string,
  landingTime: Date,
): number | null {
  const release = combineReleaseDateTime(raceDate, releaseTime);
  const duration = landingTime.getTime() - release.getTime();
  return duration >= 0 ? duration : null;
}

function calculateElapsedDurationMs(from: Date, to: Date): number | null {
  const duration = to.getTime() - from.getTime();
  return duration >= 0 ? duration : null;
}

/**
 * Counts only minutes that fall inside the daily racing window [startTime, endTime].
 * Overnight hours after end time until the next day's start time are excluded.
 */
export function calculateWindowedDurationMs(
  from: Date,
  to: Date,
  startTime: string,
  endTime: string,
): number | null {
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return null;
  }

  if (to.getTime() < from.getTime()) {
    return null;
  }

  let total = 0;
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const lastDay = new Date(to.getFullYear(), to.getMonth(), to.getDate());

  while (cursor.getTime() <= lastDay.getTime()) {
    const dateKey = toDateString(cursor);
    const windowStart = combineReleaseDateTime(dateKey, startTime);
    const windowEnd = combineReleaseDateTime(dateKey, endTime);
    const segmentStart = Math.max(from.getTime(), windowStart.getTime());
    const segmentEnd = Math.min(to.getTime(), windowEnd.getTime());

    if (segmentEnd > segmentStart) {
      total += segmentEnd - segmentStart;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return total;
}

function earliestLanding(pigeon: TournamentResultPigeonInput): Date | null {
  if (pigeon.landings.length === 0) {
    return null;
  }

  return pigeon.landings.reduce(
    (earliest, landing) =>
      landing.landingTime.getTime() < earliest.getTime() ? landing.landingTime : earliest,
    pigeon.landings[0].landingTime,
  );
}

function toLandingInputs(
  pigeons: TournamentResultPigeonInput[],
  raceDays: ResultRaceDayInput[],
): ResultPigeonLandingInput[] {
  const raceDaysById = new Map(raceDays.map((raceDay) => [raceDay.raceDayId, raceDay]));

  return pigeons.map((pigeon) => ({
    registrationPigeonId: pigeon.registrationPigeonId,
    participantId: pigeon.participantId,
    participantName: pigeon.participantName,
    loftName: pigeon.loftName,
    pigeonNumber: pigeon.pigeonNumber,
    ringNumber: pigeon.ringNumber,
    isDoubleStamp: pigeon.isDoubleStamp,
    landingTime: earliestLanding(pigeon),
    calculatedDurationMs:
      pigeon.landings.length > 0
        ? pigeon.landings.reduce((total, landing) => {
            const raceDay = raceDaysById.get(landing.raceDayId);
            if (!raceDay) return total;
            const origin = combineReleaseDateTime(raceDay.raceDate, raceDay.releaseTime);
            return total + (calculateElapsedDurationMs(origin, landing.landingTime) ?? 0);
          }, 0)
        : null,
    profileImage: pigeon.profileImage ?? null,
  }));
}

export function buildPigeonRows(
  pigeons: ResultPigeonLandingInput[],
  origin: Date,
  _window: RacingWindow,
): ResultPigeonRow[] {
  return pigeons.map((pigeon) => ({
    registrationPigeonId: pigeon.registrationPigeonId,
    participantId: pigeon.participantId,
    pigeonNumber: pigeon.pigeonNumber,
    ringNumber: pigeon.ringNumber,
    isDoubleStamp: pigeon.isDoubleStamp,
    isBrave: false,
    landingTimeMs: pigeon.landingTime
      ? (pigeon.calculatedDurationMs ?? calculateElapsedDurationMs(origin, pigeon.landingTime))
      : null,
    landingClockTime: pigeon.landingTime ? formatLandingTimeForInput(pigeon.landingTime) : null,
  }));
}

export function aggregateParticipantResults(
  pigeons: ResultPigeonLandingInput[],
  origin: Date,
  window: RacingWindow,
  now: Date,
  raceEnd: Date,
): Omit<ParticipantResultRow, 'rank'>[] {
  const grouped = new Map<
    string,
    {
      participantId: string;
      participantName: string;
      loftName: string;
      profileImage: string | null;
      pigeons: ResultPigeonLandingInput[];
    }
  >();

  for (const pigeon of pigeons) {
    const existing = grouped.get(pigeon.participantId) ?? {
      participantId: pigeon.participantId,
      participantName: pigeon.participantName,
      loftName: pigeon.loftName,
      profileImage: pigeon.profileImage ?? null,
      pigeons: [],
    };
    existing.pigeons.push(pigeon);
    grouped.set(pigeon.participantId, existing);
  }

  const effectiveNow = now.getTime() < raceEnd.getTime() ? now : raceEnd;

  return [...grouped.values()].map((participant) => {
    const rows = buildPigeonRows(participant.pigeons, origin, window);
    const landed = rows.filter((pigeon) => pigeon.landingTimeMs !== null);
    const totalLandingTimeMs = landed.reduce((sum, pigeon) => sum + (pigeon.landingTimeMs ?? 0), 0);
    const remainingPigeons = participant.pigeons.length - landed.length;
    const currentFlyingTimeMs =
      remainingPigeons > 0 ? (calculateElapsedDurationMs(origin, effectiveNow) ?? 0) : null;

    return {
      participantId: participant.participantId,
      participantName: participant.participantName,
      loftName: participant.loftName,
      profileImage: participant.profileImage,
      totalPigeons: participant.pigeons.length,
      landedPigeons: landed.length,
      remainingPigeons,
      totalLandingTimeMs,
      averageLandingTimeMs:
        landed.length > 0 ? Number((totalLandingTimeMs / landed.length).toFixed(2)) : null,
      currentFlyingTimeMs,
      pigeons: rows.sort((a, b) => a.pigeonNumber - b.pigeonNumber),
    };
  });
}

export function assignCompetitionRanks(
  participants: Omit<ParticipantResultRow, 'rank'>[],
): ParticipantResultRow[] {
  const eligible = participants
    .filter((participant) => participant.landedPigeons > 0)
    .sort((a, b) => {
      if (a.totalLandingTimeMs !== b.totalLandingTimeMs) {
        return a.totalLandingTimeMs - b.totalLandingTimeMs;
      }
      return a.participantId.localeCompare(b.participantId);
    });

  const ineligible = participants
    .filter((participant) => participant.landedPigeons === 0)
    .sort((a, b) => a.participantName.localeCompare(b.participantName));

  const ranked: ParticipantResultRow[] = [];
  let currentRank = 1;

  for (let index = 0; index < eligible.length; index += 1) {
    if (
      index > 0 &&
      eligible[index].totalLandingTimeMs !== eligible[index - 1].totalLandingTimeMs
    ) {
      currentRank = index + 1;
    }

    ranked.push({
      ...eligible[index],
      rank: currentRank,
    });
  }

  for (const participant of ineligible) {
    ranked.push({
      ...participant,
      rank: null,
    });
  }

  return ranked;
}

export function summarizeCounts(
  participants: Omit<ParticipantResultRow, 'rank'>[],
): ResultSummaryCounts {
  return participants.reduce(
    (summary, participant) => ({
      totalPigeons: summary.totalPigeons + participant.totalPigeons,
      landedPigeons: summary.landedPigeons + participant.landedPigeons,
      remainingPigeons: summary.remainingPigeons + participant.remainingPigeons,
    }),
    { totalPigeons: 0, landedPigeons: 0, remainingPigeons: 0 },
  );
}

function durationFromOrigin(landingTime: Date, origin: Date, _window: RacingWindow): number | null {
  return calculateElapsedDurationMs(origin, landingTime);
}

function compareLandingTimes(
  left: ResultPigeonLandingInput,
  right: ResultPigeonLandingInput,
): number {
  const timeDiff = (left.landingTime?.getTime() ?? 0) - (right.landingTime?.getTime() ?? 0);
  if (timeDiff !== 0) {
    return timeDiff;
  }
  return left.pigeonNumber - right.pigeonNumber;
}

function groupPigeonsByParticipant(
  pigeons: ResultPigeonLandingInput[],
): Map<string, ResultPigeonLandingInput[]> {
  const grouped = new Map<string, ResultPigeonLandingInput[]>();

  for (const pigeon of pigeons) {
    const existing = grouped.get(pigeon.participantId) ?? [];
    existing.push(pigeon);
    grouped.set(pigeon.participantId, existing);
  }

  return grouped;
}

function toPigeonWinner(
  pigeon: ResultPigeonLandingInput,
  category: 'first' | 'last',
  valueMs: number,
): ResultWinner {
  return {
    participantId: pigeon.participantId,
    participantName: pigeon.participantName,
    loftName: pigeon.loftName,
    profileImage: pigeon.profileImage ?? null,
    registrationPigeonId: pigeon.registrationPigeonId,
    pigeonNumber: pigeon.pigeonNumber,
    ringNumber: pigeon.ringNumber,
    valueMs,
    landingClockTime: pigeon.landingTime ? formatLandingTimeForInput(pigeon.landingTime) : null,
    category,
  };
}

export function isRaceEnded(raceEnd: Date, now: Date, status?: string): boolean {
  if (status === RaceDayStatus.COMPLETED || status === TournamentStatus.COMPLETED) {
    return true;
  }

  return now.getTime() >= raceEnd.getTime();
}

export function formatWinnerValue(winner: ResultWinner): string {
  if (winner.category === 'average') {
    return formatClockDuration(winner.valueMs);
  }

  return winner.landingClockTime ?? formatClockDuration(winner.valueMs);
}

export function toBravePigeon(lastWinner: ResultWinner | null): ResultWinner | null {
  if (!lastWinner?.registrationPigeonId) {
    return null;
  }

  return {
    ...lastWinner,
    category: 'brave',
  };
}

export function markBravePigeon(
  rankings: ParticipantResultRow[],
  bravePigeon: ResultWinner | null,
): ParticipantResultRow[] {
  const bravePigeonId = bravePigeon?.registrationPigeonId;
  if (!bravePigeonId) {
    return rankings.map((row) => ({
      ...row,
      pigeons: row.pigeons.map((pigeon) => ({ ...pigeon, isBrave: false })),
    }));
  }

  return rankings.map((row) => ({
    ...row,
    pigeons: row.pigeons.map((pigeon) => ({
      ...pigeon,
      isBrave: pigeon.registrationPigeonId === bravePigeonId,
    })),
  }));
}

/**
 * First winner is the loft whose first pigeon landed last,
 * once every loft has at least one pigeon home.
 */
export function findFirstWinner(
  pigeons: ResultPigeonLandingInput[],
  origin: Date,
  window: RacingWindow,
): ResultWinner | null {
  const grouped = groupPigeonsByParticipant(pigeons);
  if (grouped.size === 0) {
    return null;
  }

  const firstPigeons: ResultPigeonLandingInput[] = [];

  for (const participantPigeons of grouped.values()) {
    const landed = participantPigeons
      .filter((pigeon) => pigeon.landingTime)
      .sort(compareLandingTimes);

    if (landed.length === 0) {
      return null;
    }

    firstPigeons.push(landed[0]);
  }

  firstPigeons.sort((left, right) => {
    const timeDiff = compareLandingTimes(right, left);
    if (timeDiff !== 0) {
      return timeDiff;
    }
    return left.participantId.localeCompare(right.participantId);
  });

  const winner = firstPigeons[0];
  if (!winner.landingTime) {
    return null;
  }

  const duration = durationFromOrigin(winner.landingTime, origin, window);
  return toPigeonWinner(winner, 'first', duration ?? 0);
}

/**
 * Last winner is calculated after the race ends. Only lofts that landed the
 * full tournament pigeon quota before race end are eligible. Among those,
 * the loft whose last (Nth) pigeon landed closest to race end wins.
 */
export function findLastWinner(
  pigeons: ResultPigeonLandingInput[],
  origin: Date,
  window: RacingWindow,
  options: {
    totalPigeonsAllowed?: number;
    raceEnded: boolean;
    raceEnd: Date;
  },
): ResultWinner | null {
  if (!options.raceEnded) {
    return null;
  }

  const grouped = groupPigeonsByParticipant(pigeons);
  let winner: ResultWinner | null = null;
  let winnerLandingMs = -1;

  for (const participantPigeons of grouped.values()) {
    const requiredCount = options.totalPigeonsAllowed ?? participantPigeons.length;
    if (requiredCount <= 0) {
      continue;
    }

    const landed = participantPigeons
      .filter(
        (pigeon): pigeon is ResultPigeonLandingInput & { landingTime: Date } =>
          pigeon.landingTime !== null,
      )
      .sort(compareLandingTimes);

    if (landed.length < requiredCount) {
      continue;
    }

    const lastPigeon = landed[requiredCount - 1];
    if (lastPigeon.landingTime.getTime() > options.raceEnd.getTime()) {
      continue;
    }

    const landingMs = lastPigeon.landingTime.getTime();
    if (
      landingMs > winnerLandingMs ||
      (landingMs === winnerLandingMs &&
        lastPigeon.participantId.localeCompare(winner?.participantId ?? '') < 0)
    ) {
      const duration = durationFromOrigin(lastPigeon.landingTime, origin, window);
      winner = toPigeonWinner(lastPigeon, 'last', duration ?? 0);
      winnerLandingMs = landingMs;
    }
  }

  return winner;
}

/**
 * Average winner is the loft with the highest total flying time.
 */
export function findAverageWinner(
  participants: Omit<ParticipantResultRow, 'rank'>[],
): ResultWinner | null {
  const eligible = participants.filter((participant) => participant.landedPigeons > 0);

  if (eligible.length === 0) return null;

  const sorted = [...eligible].sort((a, b) => {
    if (a.totalLandingTimeMs !== b.totalLandingTimeMs) {
      return b.totalLandingTimeMs - a.totalLandingTimeMs;
    }
    return a.participantId.localeCompare(b.participantId);
  });

  const winner = sorted[0];
  return {
    participantId: winner.participantId,
    participantName: winner.participantName,
    loftName: winner.loftName,
    profileImage: winner.profileImage ?? null,
    valueMs: winner.totalLandingTimeMs,
    landingClockTime: formatClockDuration(winner.totalLandingTimeMs),
    category: 'average',
  };
}

function racingWindowFrom(
  input: Pick<TournamentResultInput, 'startTime' | 'endTime'>,
): RacingWindow {
  return {
    startTime: input.startTime,
    endTime: input.endTime,
  };
}

export function calculateDailyResults(
  raceDay: ResultRaceDayInput,
  pigeons: ResultPigeonLandingInput[],
  window: RacingWindow,
  nowOrOptions: Date | ResultCalculationOptions = new Date(),
): DailyResultDto {
  const options: ResultCalculationOptions =
    nowOrOptions instanceof Date ? { now: nowOrOptions } : nowOrOptions;
  const now = options.now ?? new Date();
  const origin = combineReleaseDateTime(raceDay.raceDate, raceDay.releaseTime);
  const raceEnd = combineReleaseDateTime(raceDay.raceDate, raceDay.endTime);
  const raceEnded =
    options.raceEnded !== undefined ? options.raceEnded : isRaceEnded(raceEnd, now, raceDay.status);
  const aggregates = aggregateParticipantResults(pigeons, origin, window, now, raceEnd);
  const rankings = assignCompetitionRanks(aggregates);
  const lastWinner = findLastWinner(pigeons, origin, window, {
    totalPigeonsAllowed: options.totalPigeonsAllowed,
    raceEnded,
    raceEnd,
  });
  const bravePigeon = toBravePigeon(lastWinner);

  return {
    raceDayId: raceDay.raceDayId,
    raceDate: raceDay.raceDate,
    releaseTime: raceDay.releaseTime,
    summary: summarizeCounts(aggregates),
    firstWinner: findFirstWinner(pigeons, origin, window),
    lastWinner,
    averageWinner: findAverageWinner(aggregates),
    bravePigeon,
    rankings: markBravePigeon(rankings, bravePigeon),
  };
}

export function calculateTotalResults(
  input: TournamentResultInput,
  nowOrOptions: Date | ResultCalculationOptions = new Date(),
): TotalResultDto {
  const options: ResultCalculationOptions =
    nowOrOptions instanceof Date ? { now: nowOrOptions } : nowOrOptions;
  const now = options.now ?? new Date();
  const window = racingWindowFrom(input);
  const originDate = input.raceDays[0]?.raceDate ?? input.startDate;
  const originTime = input.raceDays[0]?.releaseTime ?? input.startTime;
  const origin = combineReleaseDateTime(originDate, originTime);
  const raceEnd = combineReleaseDateTime(input.endDate, input.endTime);
  const raceEnded =
    options.raceEnded !== undefined ? options.raceEnded : isRaceEnded(raceEnd, now, input.status);
  const landingInputs = toLandingInputs(input.pigeons, input.raceDays);
  const uniquePigeonKeys = new Set(input.pigeons.map((pigeon) => pigeon.registrationPigeonId));
  const landedPigeonKeys = new Set(
    landingInputs
      .filter((pigeon) => pigeon.landingTime)
      .map((pigeon) => pigeon.registrationPigeonId),
  );

  const aggregates = aggregateParticipantResults(landingInputs, origin, window, now, raceEnd);
  const rankings = assignCompetitionRanks(aggregates);
  const totalPigeonsAllowed = options.totalPigeonsAllowed ?? input.totalPigeonsAllowed;
  const lastWinner = findLastWinner(landingInputs, origin, window, {
    totalPigeonsAllowed,
    raceEnded,
    raceEnd,
  });
  const bravePigeon = toBravePigeon(lastWinner);

  return {
    tournamentId: input.tournamentId,
    raceDayCount: input.raceDays.length,
    summary: {
      totalPigeons: uniquePigeonKeys.size,
      landedPigeons: landedPigeonKeys.size,
      remainingPigeons: uniquePigeonKeys.size - landedPigeonKeys.size,
    },
    firstWinner: findFirstWinner(landingInputs, origin, window),
    lastWinner,
    averageWinner: findAverageWinner(aggregates),
    bravePigeon,
    rankings: markBravePigeon(rankings, bravePigeon),
  };
}

export function calculateDoubleStampResults(
  scope: 'daily' | 'total',
  pigeons: ResultPigeonLandingInput[] | TournamentResultPigeonInput[],
  window: RacingWindow,
  raceDay?: ResultRaceDayInput,
  tournamentInput?: TournamentResultInput,
  nowOrOptions: Date | ResultCalculationOptions = new Date(),
): DoubleStampResultDto {
  const options: ResultCalculationOptions =
    nowOrOptions instanceof Date ? { now: nowOrOptions } : nowOrOptions;

  if (scope === 'daily') {
    if (!raceDay) {
      throw new Error('Race day is required for daily double stamp results');
    }

    const filtered = (pigeons as ResultPigeonLandingInput[]).filter(
      (pigeon) => pigeon.isDoubleStamp,
    );
    const daily = calculateDailyResults(raceDay, filtered, window, {
      ...options,
      totalPigeonsAllowed: undefined,
    });

    return {
      scope: 'daily',
      raceDayId: raceDay.raceDayId,
      summary: daily.summary,
      firstWinner: daily.firstWinner,
      lastWinner: daily.lastWinner,
      averageWinner: daily.averageWinner,
      bravePigeon: daily.bravePigeon,
      rankings: daily.rankings,
    };
  }

  if (!tournamentInput) {
    throw new Error('Tournament input is required for total double stamp results');
  }

  const filtered = tournamentInput.pigeons.filter((pigeon) => pigeon.isDoubleStamp);
  const total = calculateTotalResults(
    {
      ...tournamentInput,
      pigeons: filtered,
    },
    {
      ...options,
      totalPigeonsAllowed: undefined,
    },
  );

  return {
    scope: 'total',
    summary: total.summary,
    firstWinner: total.firstWinner,
    lastWinner: total.lastWinner,
    averageWinner: total.averageWinner,
    bravePigeon: total.bravePigeon,
    rankings: total.rankings,
  };
}

export function toDailyPigeonInputs(
  input: TournamentResultInput,
  raceDayId: string,
): ResultPigeonLandingInput[] {
  return input.pigeons.map((pigeon) => {
    const landing = pigeon.landings.find((item) => item.raceDayId === raceDayId);
    return {
      registrationPigeonId: pigeon.registrationPigeonId,
      participantId: pigeon.participantId,
      participantName: pigeon.participantName,
      loftName: pigeon.loftName,
      pigeonNumber: pigeon.pigeonNumber,
      ringNumber: pigeon.ringNumber,
      isDoubleStamp: pigeon.isDoubleStamp,
      landingTime: landing?.landingTime ?? null,
      profileImage: pigeon.profileImage ?? null,
    };
  });
}
