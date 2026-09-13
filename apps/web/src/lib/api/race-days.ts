import { RaceDayDto } from '@kabootar/shared';

import { fetchApi } from './client';

export async function getRaceDays(tournamentId: string): Promise<RaceDayDto[]> {
  try {
    return (
      (await fetchApi<RaceDayDto[]>(`/tournaments/${tournamentId}/race-days`, {
        cacheSeconds: 30,
      })) ?? []
    );
  } catch {
    return [];
  }
}
