import { TOURNAMENT_STATUS_LABELS, TournamentStatus } from '@kabootar/shared';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Date-only values are UTC midnight. Formatting in the visitor's timezone
  // moves that midnight to the previous calendar day west of UTC.
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

export function formatStatus(status: TournamentStatus | string): string {
  return TOURNAMENT_STATUS_LABELS[status as TournamentStatus] ?? status;
}

export function countParticipantLofts(participantIds: string[]): number {
  return new Set(participantIds.filter(Boolean)).size;
}
