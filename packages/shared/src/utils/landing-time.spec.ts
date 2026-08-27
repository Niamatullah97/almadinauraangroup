import { RaceDayStatus } from '../types/race-day';

import {
  assertOrganizerRaceDayIsLive,
  assertRaceDayAcceptsLandingTimes,
  combineRaceDateAndLandingTime,
  cumulativeClockTimeInputs,
  findDuplicateRegistrationPigeonIds,
  formatLandingTimeForInput,
  formatTypedClockTime,
  normalizeLandingTimeInput,
  sumClockTimeInputs,
} from './landing-time';

describe('landing-time utils', () => {
  describe('assertRaceDayAcceptsLandingTimes', () => {
    it('allows live race days', () => {
      expect(() => assertRaceDayAcceptsLandingTimes(RaceDayStatus.LIVE)).not.toThrow();
    });

    it('rejects pending race days', () => {
      expect(() => assertRaceDayAcceptsLandingTimes(RaceDayStatus.PENDING)).toThrow(
        'Landing times can only be entered while the race day is Live',
      );
    });

    it('rejects completed race days', () => {
      expect(() => assertRaceDayAcceptsLandingTimes(RaceDayStatus.COMPLETED)).toThrow(
        'Landing times can only be entered while the race day is Live',
      );
    });
  });

  describe('assertOrganizerRaceDayIsLive', () => {
    it('allows live race days', () => {
      expect(() => assertOrganizerRaceDayIsLive(RaceDayStatus.LIVE)).not.toThrow();
    });

    it('rejects completed race days for organizers', () => {
      expect(() => assertOrganizerRaceDayIsLive(RaceDayStatus.COMPLETED)).toThrow(
        'Organizers can only enter landing times after the race day has started',
      );
    });
  });

  describe('combineRaceDateAndLandingTime', () => {
    it('combines race date and HH:mm time in Asia/Karachi', () => {
      const result = combineRaceDateAndLandingTime('2026-04-01', '14:35');
      expect(result.toISOString()).toBe(new Date('2026-04-01T14:35:00+05:00').toISOString());
    });
  });

  describe('normalizeLandingTimeInput', () => {
    it('accepts HH:mm format', () => {
      expect(normalizeLandingTimeInput('09:15')).toBe('09:15:00');
    });

    it('accepts HH:mm:ss format', () => {
      expect(normalizeLandingTimeInput('09:15:45')).toBe('09:15:45');
    });
  });

  describe('findDuplicateRegistrationPigeonIds', () => {
    it('returns duplicate pigeon ids', () => {
      expect(findDuplicateRegistrationPigeonIds(['a', 'b', 'a'])).toEqual(['a']);
    });
  });

  describe('formatLandingTimeForInput', () => {
    it('formats datetime to HH:mm:ss in Asia/Karachi', () => {
      const formatted = formatLandingTimeForInput(new Date('2026-04-01T14:35:22+05:00'));
      expect(formatted).toBe('14:35:22');
    });
  });

  describe('sumClockTimeInputs', () => {
    it('sums entered clock times as a duration total', () => {
      expect(sumClockTimeInputs(['11:46:00', '13:47:00'])).toBe('25:33:00');
    });

    it('returns null when no times are entered', () => {
      expect(sumClockTimeInputs([null, '', undefined])).toBeNull();
    });
  });

  describe('cumulativeClockTimeInputs', () => {
    it('returns a running total for each entered pigeon time', () => {
      expect(cumulativeClockTimeInputs(['11:46:00', '13:47:00', ''])).toEqual([
        '11:46:00',
        '25:33:00',
        null,
      ]);
    });
  });

  describe('formatTypedClockTime', () => {
    it('inserts colons while typing digits', () => {
      expect(formatTypedClockTime('114600')).toBe('11:46:00');
    });
  });
});
