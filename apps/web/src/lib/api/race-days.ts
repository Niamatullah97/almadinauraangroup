import { RaceDayDto } from '@kabootar/shared';

import { fetchApi } from './client';

export async function getRaceDays(tournamentId: string): Promise<RaceDayDto[]> {
  return (await fetchApi<RaceDayDto[]>(`/tournaments/${tournamentId}/race-days`)) ?? [];
}
