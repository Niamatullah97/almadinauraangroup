import type { RaceDayDto } from '@kabootar/shared';
import { APP_TIMEZONE } from '@kabootar/shared';

export function calendarDateInAppTimezone(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function pickDefaultRaceDay<T extends Pick<RaceDayDto, 'raceDate'>>(
  raceDays: T[],
  today = calendarDateInAppTimezone(),
): T | null {
  if (raceDays.length === 0) return null;

  const sorted = [...raceDays].sort((left, right) => left.raceDate.localeCompare(right.raceDate));
  const onOrBeforeToday = sorted.filter((day) => day.raceDate <= today);

  if (onOrBeforeToday.length > 0) {
    return onOrBeforeToday[onOrBeforeToday.length - 1];
  }

  return sorted[0];
}
