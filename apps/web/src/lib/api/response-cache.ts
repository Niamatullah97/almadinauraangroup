const memory = new Map<string, unknown>();

function cacheRequest(key: string): Request {
  return new Request(`https://almadinauraangroup.com/__internal-cache/${encodeURIComponent(key)}`);
}

function cloudflareCache(): Cache | undefined {
  try {
    return (globalThis as { caches?: { default?: Cache } }).caches?.default;
  } catch {
    return undefined;
  }
}

export function resetResponseCache(): void {
  memory.clear();
}

export async function rememberSuccess<T>(key: string, value: T, ttlSeconds = 3600): Promise<T> {
  memory.set(key, value);

  const cache = cloudflareCache();
  if (!cache) {
    return value;
  }

  try {
    await cache.put(
      cacheRequest(key),
      new Response(JSON.stringify(value), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${ttlSeconds}`,
        },
      }),
    );
  } catch {
    // Isolate memory is enough if the Cache API is unavailable.
  }

  return value;
}

export async function readFallback<T>(key: string): Promise<T | null> {
  if (memory.has(key)) {
    return memory.get(key) as T;
  }

  const cache = cloudflareCache();
  if (!cache) {
    return null;
  }

  try {
    const cached = await cache.match(cacheRequest(key));
    if (!cached?.ok) {
      return null;
    }

    const value = (await cached.json()) as T;
    memory.set(key, value);
    return value;
  } catch {
    return null;
  }
}
