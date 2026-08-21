import {
  generateAccessLinkToken,
  generateAccessSecretKey,
  hashSecretKey,
  secretHashesMatch,
} from './access-link.util';

describe('access-link.util', () => {
  it('generates a 64-character hex link token', () => {
    expect(generateAccessLinkToken()).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates a grouped secret key', () => {
    expect(generateAccessSecretKey()).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it('hashes secret keys case-insensitively', () => {
    expect(hashSecretKey('abcd-efgh-ijkl')).toBe(hashSecretKey('ABCD-EFGH-IJKL'));
  });

  it('compares secret hashes safely', () => {
    const hash = hashSecretKey('AAAA-BBBB-CCCC');
    expect(secretHashesMatch(hash, hash)).toBe(true);
    expect(secretHashesMatch(hash, hashSecretKey('AAAA-BBBB-CCCD'))).toBe(false);
  });
});
