import { RaceDayStatus } from '../types/race-day';

export function assertRaceDayAcceptsLandingTimes(status: RaceDayStatus): void {
  if (status !== RaceDayStatus.LIVE) {
    throw new Error('Landing times can only be entered while the race day is Live');
  }
}

export function assertOrganizerRaceDayIsLive(status: RaceDayStatus): void {
  if (status !== RaceDayStatus.LIVE) {
    throw new Error('Organizers can only enter landing times after the race day has started');
  }
}

export function combineRaceDateAndLandingTime(raceDate: string, landingTime: string): Date {
  const normalizedTime = normalizeLandingTimeInput(landingTime);
  const [year, month, day] = raceDate.split('-').map(Number);
  const [hours, minutes, seconds] = normalizedTime.split(':').map(Number);

  const date = new Date(year, month - 1, day, hours, minutes, seconds || 0);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Landing time format is invalid');
  }

  return date;
}

export function normalizeLandingTimeInput(value: string): string {
  const trimmed = value.trim();

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(11, 19);
  }

  throw new Error('Landing time format is invalid');
}

export function formatLandingTimeForInput(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function formatClockHms(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function clockTimeToSeconds(value: string): number | null {
  try {
    const normalized = normalizeLandingTimeInput(value);
    const [hours, minutes, seconds] = normalized.split(':').map(Number);
    return hours * 3600 + minutes * 60 + (seconds || 0);
  } catch {
    return null;
  }
}

export function sumClockTimeInputs(times: Array<string | null | undefined>): string | null {
  const values = times.map((time) => time?.trim()).filter((time): time is string => Boolean(time));
  if (values.length === 0) {
    return null;
  }

  let totalSeconds = 0;
  for (const value of values) {
    const seconds = clockTimeToSeconds(value);
    if (seconds === null) {
      continue;
    }
    totalSeconds += seconds;
  }

  return totalSeconds > 0 || values.length > 0 ? formatClockHms(totalSeconds) : null;
}

export function cumulativeClockTimeInputs(
  times: Array<string | null | undefined>,
): Array<string | null> {
  let totalSeconds = 0;

  return times.map((time) => {
    const seconds = time?.trim() ? clockTimeToSeconds(time) : null;
    if (seconds === null) {
      return null;
    }

    totalSeconds += seconds;
    return formatClockHms(totalSeconds);
  });
}

export function formatTypedClockTime(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 6);
  const hours = digits.slice(0, 2);
  const minutes = digits.slice(2, 4);
  const seconds = digits.slice(4, 6);

  return [hours, minutes, seconds].filter((part) => part.length > 0).join(':');
}

export function findDuplicateRegistrationPigeonIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id);
    }
    seen.add(id);
  }

  return [...duplicates];
}
