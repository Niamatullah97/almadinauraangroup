import { describe, expect, it } from 'vitest';

import { formatDate } from './format';

describe('formatDate', () => {
  it('keeps the saved calendar date instead of the viewer timezone', () => {
    expect(formatDate('2026-10-03')).toMatch(/03-Oct-2026/i);
    expect(formatDate('2026-09-29')).toMatch(/29-Sept-2026/i);
  });
});
