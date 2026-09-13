import { DailyResultDto, DoubleStampResultDto, TotalResultDto } from '@kabootar/shared';

import { fetchApi } from './client';

async function fetchResults<T>(path: string): Promise<T | null> {
  try {
    return await fetchApi<T>(path, { cacheSeconds: 10 });
  } catch {
    return null;
  }
}

export async function getTotalResults(tournamentId: string): Promise<TotalResultDto | null> {
  return fetchResults<TotalResultDto>(`/tournaments/${tournamentId}/results`);
}

export async function getTotalDoubleStampResults(
  tournamentId: string,
): Promise<DoubleStampResultDto | null> {
  return fetchResults<DoubleStampResultDto>(`/tournaments/${tournamentId}/results/double-stamp`);
}

export async function getTotalSingleNominatedResults(
  tournamentId: string,
): Promise<DoubleStampResultDto | null> {
  return fetchResults<DoubleStampResultDto>(
    `/tournaments/${tournamentId}/results/single-nominated`,
  );
}

export async function getDailyResults(
  tournamentId: string,
  raceDayId: string,
): Promise<DailyResultDto | null> {
  return fetchResults<DailyResultDto>(
    `/tournaments/${tournamentId}/race-days/${raceDayId}/results`,
  );
}

export async function getDailyDoubleStampResults(
  tournamentId: string,
  raceDayId: string,
): Promise<DoubleStampResultDto | null> {
  return fetchResults<DoubleStampResultDto>(
    `/tournaments/${tournamentId}/race-days/${raceDayId}/results/double-stamp`,
  );
}
