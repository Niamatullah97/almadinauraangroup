import { isUnthrottledHttpMethod } from './app-throttler.guard';

describe('isUnthrottledHttpMethod', () => {
  it('skips rate limits for public read methods used by the customer site', () => {
    expect(isUnthrottledHttpMethod('GET')).toBe(true);
    expect(isUnthrottledHttpMethod('head')).toBe(true);
    expect(isUnthrottledHttpMethod('OPTIONS')).toBe(true);
  });

  it('keeps rate limits on mutating methods', () => {
    expect(isUnthrottledHttpMethod('POST')).toBe(false);
    expect(isUnthrottledHttpMethod('PATCH')).toBe(false);
    expect(isUnthrottledHttpMethod('DELETE')).toBe(false);
    expect(isUnthrottledHttpMethod(undefined)).toBe(false);
  });
});
