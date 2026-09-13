import {
  RaceDayDto,
  TournamentDetailDto,
  TournamentDto,
  TournamentListResponse,
} from '@kabootar/shared';

import { fetchApi } from './client';
import { getRaceDays } from './race-days';

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

export async function loadTournament(id: string): Promise<{
  tournament: TournamentDetailDto | null;
  unavailable: boolean;
}> {
  try {
    return { tournament: await getTournament(id), unavailable: false };
  } catch {
    return { tournament: null, unavailable: true };
  }
}

export async function loadTournamentContext(id: string): Promise<{
  tournament: TournamentDetailDto | null;
  raceDays: RaceDayDto[];
  unavailable: boolean;
}> {
  const { tournament, unavailable } = await loadTournament(id);
  if (unavailable) {
    return { tournament: null, raceDays: [], unavailable: true };
  }

  try {
    return { tournament, raceDays: await getRaceDays(id), unavailable: false };
  } catch {
    return { tournament, raceDays: [], unavailable: false };
  }
}
