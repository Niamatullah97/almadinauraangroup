import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiRequestError, fetchApi } from './client';

describe('fetchApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null for an actual 404 without retrying', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchApi('/tournaments/missing')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries rate-limit responses then returns data', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { id: 't1' } }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchApi<{ id: string }>('/tournaments/t1')).resolves.toEqual({ id: 't1' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws after retrying persistent server errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchApi('/tournaments')).rejects.toBeInstanceOf(ApiRequestError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries aborted network requests then returns data', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('The operation was aborted'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { items: [] } }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchApi('/tournaments?limit=100')).resolves.toEqual({ items: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('dedupes concurrent requests to the same path', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { id: 't1' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const [first, second] = await Promise.all([
      fetchApi('/tournaments/t1'),
      fetchApi('/tournaments/t1'),
    ]);

    expect(first).toEqual({ id: 't1' });
    expect(second).toEqual({ id: 't1' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
