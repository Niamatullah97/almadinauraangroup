/** Business timezone for race clocks (Pakistan has no DST). */
export const APP_TIMEZONE = 'Asia/Karachi';
export const APP_UTC_OFFSET = '+05:00';

export function combineDateAndClockTime(
  date: string,
  time: string,
  options?: { includeSeconds?: boolean },
): Date {
  const includeSeconds = options?.includeSeconds ?? false;
  const [hours, minutes, maybeSeconds] = time.split(':').map(Number);
  const seconds = includeSeconds ? maybeSeconds || 0 : 0;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const value = new Date(`${date}T${hh}:${mm}:${ss}${APP_UTC_OFFSET}`);

  if (Number.isNaN(value.getTime())) {
    throw new Error('Invalid date/time');
  }

  return value;
}

export function formatClockInAppTimezone(value: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(value);

  const lookup = Object.fromEntries(
    parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
  );
  return `${lookup.hour}:${lookup.minute}:${lookup.second}`;
}
