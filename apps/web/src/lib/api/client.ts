import { ApiResponse } from '@kabootar/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 8000;
const RETRY_BASE_MS = process.env.VITEST ? 0 : 200;
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

const inflight = new Map<string, Promise<unknown>>();

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T | null> {
  const key = `${init?.method ?? 'GET'}:${path}`;
  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T | null>;
  }

  const request = fetchApiWithRetry<T>(path, init).finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, request);
  return request;
}

async function fetchApiWithRetry<T>(path: string, init?: RequestInit): Promise<T | null> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await fetchApiOnce<T>(path, init);
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === MAX_ATTEMPTS) {
        throw error;
      }
      await delay(RETRY_BASE_MS * 2 ** (attempt - 1));
    }
  }

  throw lastError instanceof Error ? lastError : new ApiRequestError('Request failed');
}

async function fetchApiOnce<T>(path: string, init?: RequestInit): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: 'no-store',
      signal: init?.signal ?? controller.signal,
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new ApiRequestError(`API request failed with ${res.status}`, res.status);
    }

    const json: ApiResponse<T> = await res.json();
    return json.success ? json.data : null;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    throw new ApiRequestError(error instanceof Error ? error.message : 'API request failed');
  } finally {
    clearTimeout(timeout);
  }
}

function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiRequestError)) {
    return true;
  }
  return error.status !== undefined && RETRYABLE_STATUS.has(error.status);
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}
