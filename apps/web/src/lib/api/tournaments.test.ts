import { afterEach, describe, expect, it, vi } from 'vitest';

import { getTournament, getTournaments } from '@/lib/api/tournaments';

describe('tournaments API', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches tournament list items', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            items: [{ id: 't1', title: 'Spring Cup' }],
            total: 1,
            page: 1,
            limit: 100,
            totalPages: 1,
          },
        }),
      }),
    );

    const tournaments = await getTournaments();
    expect(tournaments).toEqual([{ id: 't1', title: 'Spring Cup' }]);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/tournaments?limit=100',
      expect.objectContaining({ next: { revalidate: 60 } }),
    );
  });

  it('returns null when tournament detail fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    const tournament = await getTournament('missing');
    expect(tournament).toBeNull();
  });
});
