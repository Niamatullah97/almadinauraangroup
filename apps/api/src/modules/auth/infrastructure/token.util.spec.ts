import { generateRefreshToken, getRefreshTokenExpiry, hashToken } from './token.util';

describe('token.util', () => {
  describe('hashToken', () => {
    it('returns consistent SHA-256 hash for same input', () => {
      const token = 'test-refresh-token';
      expect(hashToken(token)).toBe(hashToken(token));
    });

    it('returns different hashes for different inputs', () => {
      expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
    });

    it('returns a 64-character hex string', () => {
      expect(hashToken('any-token')).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('generateRefreshToken', () => {
    it('generates unique tokens', () => {
      const a = generateRefreshToken();
      const b = generateRefreshToken();
      expect(a).not.toBe(b);
    });

    it('generates a 128-character hex string', () => {
      expect(generateRefreshToken()).toMatch(/^[a-f0-9]{128}$/);
    });
  });

  describe('getRefreshTokenExpiry', () => {
    it('returns a date in the future', () => {
      const expiry = getRefreshTokenExpiry(7);
      expect(expiry.getTime()).toBeGreaterThan(Date.now());
    });
  });
});
