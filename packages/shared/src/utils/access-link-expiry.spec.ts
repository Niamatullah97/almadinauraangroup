import { AccessLinkExpiryPreset } from '../types/tournament-access-link';
import { isAccessLinkExpired, resolveAccessLinkExpiry } from './access-link-expiry';

describe('access-link-expiry', () => {
  const now = new Date(2026, 7, 15, 10, 0, 0);

  it('resolves today as the end of the current day', () => {
    const expiresAt = resolveAccessLinkExpiry(AccessLinkExpiryPreset.TODAY, undefined, now);
    expect(expiresAt.getFullYear()).toBe(2026);
    expect(expiresAt.getMonth()).toBe(7);
    expect(expiresAt.getDate()).toBe(15);
    expect(expiresAt.getHours()).toBe(23);
    expect(expiresAt.getMinutes()).toBe(59);
  });

  it('resolves tomorrow as the end of the next day', () => {
    const expiresAt = resolveAccessLinkExpiry(AccessLinkExpiryPreset.TOMORROW, undefined, now);
    expect(expiresAt.getDate()).toBe(16);
    expect(expiresAt.getHours()).toBe(23);
  });

  it('resolves 7 days from now', () => {
    const expiresAt = resolveAccessLinkExpiry(AccessLinkExpiryPreset.DAYS_7, undefined, now);
    expect(expiresAt.getTime()).toBe(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  });

  it('resolves a custom date', () => {
    const custom = new Date(2026, 8, 1, 18, 0, 0);
    const expiresAt = resolveAccessLinkExpiry(AccessLinkExpiryPreset.CUSTOM, custom, now);
    expect(expiresAt.getTime()).toBe(custom.getTime());
  });

  it('requires a custom date for the custom preset', () => {
    expect(() => resolveAccessLinkExpiry(AccessLinkExpiryPreset.CUSTOM, undefined, now)).toThrow(
      'A custom expiration date is required',
    );
  });

  it('detects expired links', () => {
    expect(isAccessLinkExpired(new Date(2026, 7, 15, 9, 0, 0), now)).toBe(true);
    expect(isAccessLinkExpired(new Date(2026, 7, 15, 11, 0, 0), now)).toBe(false);
  });
});
