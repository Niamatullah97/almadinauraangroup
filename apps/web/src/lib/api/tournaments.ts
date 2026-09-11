import { TournamentDetailDto, TournamentDto, TournamentListResponse } from '@kabootar/shared';

import { fetchApi } from './client';

export async function getTournaments(): Promise<TournamentDto[]> {
  const data = await fetchApi<TournamentListResponse>('/tournaments?limit=100');
  return data?.items ?? [];
}

/** Homepage/list must not throw: an uncaught fetch crash is a Worker 500 on `/`. */
export async function loadTournamentList(): Promise<{
  tournaments: TournamentDto[];
  unavailable: boolean;
}> {
  try {
    return { tournaments: await getTournaments(), unavailable: false };
  } catch {
    return { tournaments: [], unavailable: true };
  }
}

export async function getTournament(id: string): Promise<TournamentDetailDto | null> {
  return fetchApi<TournamentDetailDto>(`/tournaments/${id}`);
}
