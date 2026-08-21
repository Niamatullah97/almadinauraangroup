import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getDailyResults,
  getTotalDoubleStampResults,
  getTotalResults,
} from '@/lib/api/results';

describe('results API', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches total results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            tournamentId: 't1',
            raceDayCount: 2,
            summary: { totalPigeons: 50, landedPigeons: 40, remainingPigeons: 10 },
            rankings: [],
          },
        }),
      }),
    );

    const results = await getTotalResults('t1');
    expect(results?.tournamentId).toBe('t1');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/tournaments/t1/results',
      expect.any(Object),
    );
  });

  it('fetches double stamp results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            scope: 'total',
            summary: { totalPigeons: 10, landedPigeons: 8, remainingPigeons: 2 },
            rankings: [],
          },
        }),
      }),
    );

    const results = await getTotalDoubleStampResults('t1');
    expect(results?.scope).toBe('total');
  });

  it('returns null when daily results request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network error')),
    );

    const results = await getDailyResults('t1', 'rd1');
    expect(results).toBeNull();
  });
});
