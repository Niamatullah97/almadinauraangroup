import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildTournamentPageMetadata } from './tournament-metadata';

vi.mock('@/lib/api/tournaments', () => ({
  getTournament: vi.fn(),
}));

import { getTournament } from '@/lib/api/tournaments';

describe('buildTournamentPageMetadata', () => {
  afterEach(() => {
    vi.mocked(getTournament).mockReset();
  });

  it('uses the tournament title when the API is reachable', async () => {
    vi.mocked(getTournament).mockResolvedValue({
      title: 'Spring Cup',
      description: 'Live race',
    } as never);

    const metadata = await buildTournamentPageMetadata('t1', {
      path: '/tournaments/t1',
      fallbackTitle: 'Tournament',
      suffix: 'Daily Results',
    });

    expect(metadata.title).toBe('Spring Cup — Daily Results | AlMadina Uraan Group');
  });

  it('falls back when the Worker cannot reach the API', async () => {
    vi.mocked(getTournament).mockRejectedValue(new Error('timeout'));

    const metadata = await buildTournamentPageMetadata('t1', {
      path: '/tournaments/t1',
      fallbackTitle: 'Tournament',
    });

    expect(metadata.title).toBe('Tournament | AlMadina Uraan Group');
  });
});
