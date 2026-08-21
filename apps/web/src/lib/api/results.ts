import { DailyResultDto, DoubleStampResultDto, TotalResultDto } from '@kabootar/shared';

import { fetchApi } from './client';

export async function getTotalResults(tournamentId: string): Promise<TotalResultDto | null> {
  return fetchApi<TotalResultDto>(`/tournaments/${tournamentId}/results`);
}

export async function getTotalDoubleStampResults(
  tournamentId: string,
): Promise<DoubleStampResultDto | null> {
  return fetchApi<DoubleStampResultDto>(`/tournaments/${tournamentId}/results/double-stamp`);
}

export async function getDailyResults(
  tournamentId: string,
  raceDayId: string,
): Promise<DailyResultDto | null> {
  return fetchApi<DailyResultDto>(`/tournaments/${tournamentId}/race-days/${raceDayId}/results`);
}

export async function getDailyDoubleStampResults(
  tournamentId: string,
  raceDayId: string,
): Promise<DoubleStampResultDto | null> {
  return fetchApi<DoubleStampResultDto>(
    `/tournaments/${tournamentId}/race-days/${raceDayId}/results/double-stamp`,
  );
}
