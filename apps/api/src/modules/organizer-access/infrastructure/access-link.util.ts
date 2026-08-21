import { randomBytes, timingSafeEqual } from 'crypto';

import { hashToken } from '../../auth/infrastructure/token.util';

const SECRET_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateAccessLinkToken(): string {
  return randomBytes(32).toString('hex');
}

export function generateAccessSecretKey(): string {
  const bytes = randomBytes(12);
  let raw = '';
  for (const byte of bytes) {
    raw += SECRET_ALPHABET[byte % SECRET_ALPHABET.length];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

export function normalizeSecretKey(secretKey: string): string {
  return secretKey.trim().toUpperCase();
}

export function hashSecretKey(secretKey: string): string {
  return hashToken(normalizeSecretKey(secretKey));
}

export function secretHashesMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}
