import { slugify } from './slug.util';

describe('slugify', () => {
  it('converts titles into URL-safe slugs', () => {
    expect(slugify('Spring Classic 2026!')).toBe('spring-classic-2026');
  });

  it('returns a fallback-friendly slug for empty values', () => {
    expect(slugify('   ')).toBe('');
  });
});
