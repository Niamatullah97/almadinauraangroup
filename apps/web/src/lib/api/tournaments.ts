import {
  RaceDayDto,
  TournamentDetailDto,
  TournamentDto,
  TournamentListResponse,
} from '@kabootar/shared';

import { fetchApi } from './client';
import { getRaceDays } from './race-days';
import { readFallback, rememberSuccess } from './response-cache';

const LIST_CACHE_KEY = 'tournaments:list';
const LIST_CACHE_SECONDS = 30;

export async function getTournaments(): Promise<TournamentDto[]> {
  const data = await fetchApi<TournamentListResponse>('/tournaments?limit=100', {
    cacheSeconds: LIST_CACHE_SECONDS,
  });
  return data?.items ?? [];
}

/** Homepage/list must not throw: an uncaught fetch crash is a Worker 500 on `/`. */
export async function loadTournamentList(): Promise<{
  tournaments: TournamentDto[];
  unavailable: boolean;
}> {
  try {
    const tournaments = await getTournaments();
    await rememberSuccess(LIST_CACHE_KEY, tournaments);
    return { tournaments, unavailable: false };
  } catch {
    const cached = await readFallback<TournamentDto[]>(LIST_CACHE_KEY);
    if (cached) {
      return { tournaments: cached, unavailable: false };
    }
    return { tournaments: [], unavailable: true };
  }
}

export async function getTournament(id: string): Promise<TournamentDetailDto | null> {
  return fetchApi<TournamentDetailDto>(`/tournaments/${id}`, { cacheSeconds: LIST_CACHE_SECONDS });
}

export async function loadTournament(id: string): Promise<{
  tournament: TournamentDetailDto | null;
  unavailable: boolean;
}> {
  const cacheKey = `tournaments:detail:${id}`;
  try {
    const tournament = await getTournament(id);
    if (tournament) {
      await rememberSuccess(cacheKey, tournament);
    }
    return { tournament, unavailable: false };
  } catch {
    const cached = await readFallback<TournamentDetailDto>(cacheKey);
    if (cached) {
      return { tournament: cached, unavailable: false };
    }
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
