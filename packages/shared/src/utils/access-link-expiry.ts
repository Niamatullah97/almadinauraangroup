import { AccessLinkExpiryPreset } from '../types/tournament-access-link';

export function endOfLocalDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function resolveAccessLinkExpiry(
  preset: AccessLinkExpiryPreset,
  customExpiresAt?: Date | string,
  now: Date = new Date(),
): Date {
  switch (preset) {
    case AccessLinkExpiryPreset.TODAY:
      return endOfLocalDay(now);
    case AccessLinkExpiryPreset.TOMORROW: {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return endOfLocalDay(tomorrow);
    }
    case AccessLinkExpiryPreset.DAYS_7:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case AccessLinkExpiryPreset.MONTH:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case AccessLinkExpiryPreset.CUSTOM: {
      if (!customExpiresAt) {
        throw new Error('A custom expiration date is required');
      }

      const expiresAt =
        customExpiresAt instanceof Date ? customExpiresAt : new Date(customExpiresAt);
      if (Number.isNaN(expiresAt.getTime())) {
        throw new Error('Custom expiration date is invalid');
      }

      return expiresAt;
    }
    default:
      throw new Error('Unsupported expiration preset');
  }
}

export function isAccessLinkExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
