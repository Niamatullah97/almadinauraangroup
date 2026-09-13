import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetResponseCache } from '@/lib/api/response-cache';
import {
  getTournament,
  getTournaments,
  loadTournament,
  loadTournamentList,
} from '@/lib/api/tournaments';

describe('tournaments API', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetResponseCache();
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
      expect.objectContaining({ cache: 'force-cache' }),
    );
  });

  it('returns null when tournament detail is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );

    const tournament = await getTournament('missing');
    expect(tournament).toBeNull();
  });

  it('does not throw when the tournament list request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    );

    await expect(loadTournamentList()).resolves.toEqual({
      tournaments: [],
      unavailable: true,
    });
  });

  it('keeps the last successful tournament list when the API later fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
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
      })
      .mockResolvedValue({
        ok: false,
        status: 503,
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadTournamentList()).resolves.toEqual({
      tournaments: [{ id: 't1', title: 'Spring Cup' }],
      unavailable: false,
    });
    await expect(loadTournamentList()).resolves.toEqual({
      tournaments: [{ id: 't1', title: 'Spring Cup' }],
      unavailable: false,
    });
  });

  it('marks tournament detail unavailable when the API is down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    );

    await expect(loadTournament('t1')).resolves.toEqual({
      tournament: null,
      unavailable: true,
    });
  });
});
