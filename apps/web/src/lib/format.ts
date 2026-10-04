import { TOURNAMENT_STATUS_LABELS, TournamentStatus } from '@kabootar/shared';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(new Date(value));
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
