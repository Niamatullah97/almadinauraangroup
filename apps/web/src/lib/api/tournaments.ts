import { TournamentDetailDto, TournamentDto, TournamentListResponse } from '@kabootar/shared';

import { fetchApi } from './client';

export async function getTournaments(): Promise<TournamentDto[]> {
  const data = await fetchApi<TournamentListResponse>('/tournaments?limit=100');
  return data?.items ?? [];
}

export async function getTournament(id: string): Promise<TournamentDetailDto | null> {
  return fetchApi<TournamentDetailDto>(`/tournaments/${id}`);
}
