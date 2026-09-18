import { describe, expect, it } from 'vitest';

import { pickDefaultRaceDay } from './default-race-day';

describe('pickDefaultRaceDay', () => {
  it('returns the race day that matches today', () => {
    const selected = pickDefaultRaceDay(
      [
        { id: '16', raceDate: '2026-09-16' },
        { id: '18', raceDate: '2026-09-18' },
        { id: '19', raceDate: '2026-09-19' },
      ],
      '2026-09-18',
    );

    expect(selected?.id).toBe('18');
  });

  it('returns the latest past race day when today has no race', () => {
    const selected = pickDefaultRaceDay(
      [
        { id: '16', raceDate: '2026-09-16' },
        { id: '17', raceDate: '2026-09-17' },
        { id: '19', raceDate: '2026-09-19' },
      ],
      '2026-09-18',
    );

    expect(selected?.id).toBe('17');
  });

  it('returns the nearest upcoming race day when all days are in the future', () => {
    const selected = pickDefaultRaceDay(
      [
        { id: '20', raceDate: '2026-09-20' },
        { id: '19', raceDate: '2026-09-19' },
      ],
      '2026-09-18',
    );

    expect(selected?.id).toBe('19');
  });

  it('returns null when the tournament has no race days', () => {
    expect(pickDefaultRaceDay([], '2026-09-18')).toBeNull();
  });
});
