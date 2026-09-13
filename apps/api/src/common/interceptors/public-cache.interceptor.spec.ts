import { of } from 'rxjs';

import { PublicCacheInterceptor } from './public-cache.interceptor';

function run(method: string, url: string) {
  const setHeader = jest.fn();
  const interceptor = new PublicCacheInterceptor();
  interceptor
    .intercept(
      {
        switchToHttp: () => ({
          getRequest: () => ({ method, originalUrl: url }),
          getResponse: () => ({ setHeader }),
        }),
      } as never,
      { handle: () => of({ ok: true }) },
    )
    .subscribe();
  return setHeader;
}

describe('PublicCacheInterceptor', () => {
  it('adds short cache headers for public tournament reads', () => {
    const setHeader = run('GET', '/api/v1/tournaments?limit=100');
    expect(setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, s-maxage=30, stale-while-revalidate=120',
    );
  });

  it('uses a shorter cache for live results', () => {
    const setHeader = run('GET', '/api/v1/tournaments/t1/results');
    expect(setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, s-maxage=10, stale-while-revalidate=30',
    );
  });

  it('does not cache mutating requests', () => {
    const setHeader = run('POST', '/api/v1/tournaments');
    expect(setHeader).not.toHaveBeenCalled();
  });
});
