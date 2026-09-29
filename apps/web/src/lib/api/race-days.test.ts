import { afterEach, describe, expect, it, vi } from 'vitest';

import { getRaceDays } from './race-days';

describe('getRaceDays', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns race days from the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ id: 'rd1', raceDate: '2026-09-29' }],
        }),
      }),
    );

    await expect(getRaceDays('t1')).resolves.toEqual([{ id: 'rd1', raceDate: '2026-09-29' }]);
  });

  it('throws when the race-day request fails instead of pretending there are none', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    );

    await expect(getRaceDays('t1')).rejects.toMatchObject({
      message: expect.stringContaining('503'),
    });
  });
});
