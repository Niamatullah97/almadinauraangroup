import {
  assertRegistrationPigeonLimit,
  buildQuotaPigeonNumbers,
  generateBulkRingNumber,
  getNextPigeonNumber,
  getRemainingRegistrationPigeonSlots,
} from './registration-pigeon';

describe('registration-pigeon utils', () => {
  describe('getRemainingRegistrationPigeonSlots', () => {
    it('returns remaining slots', () => {
      expect(getRemainingRegistrationPigeonSlots(5, 2)).toBe(3);
    });

    it('never returns negative values', () => {
      expect(getRemainingRegistrationPigeonSlots(5, 8)).toBe(0);
    });
  });

  describe('assertRegistrationPigeonLimit', () => {
    it('allows adding within remaining slots', () => {
      expect(() => assertRegistrationPigeonLimit(5, 2, 3)).not.toThrow();
    });

    it('rejects when adding more than remaining slots', () => {
      expect(() => assertRegistrationPigeonLimit(5, 4, 2)).toThrow(
        'Pigeon limit exceeded. Only 1 slot(s) remaining for this registration',
      );
    });
  });

  describe('generateBulkRingNumber', () => {
    it('builds a ring number with prefix and padded number', () => {
      expect(
        generateBulkRingNumber('PK', 'tournament-1234567890', 'participant-0987654321', 7),
      ).toBe('PK-TOURNA-PARTIC-007');
    });
  });

  describe('getNextPigeonNumber', () => {
    it('starts at 1 when empty', () => {
      expect(getNextPigeonNumber([])).toBe(1);
    });

    it('returns max plus one', () => {
      expect(getNextPigeonNumber([1, 3, 2])).toBe(4);
    });
  });

  describe('buildQuotaPigeonNumbers', () => {
    it('builds pigeon numbers 1 through the quota', () => {
      expect(buildQuotaPigeonNumbers(3)).toEqual([1, 2, 3]);
    });

    it('returns an empty list for invalid quotas', () => {
      expect(buildQuotaPigeonNumbers(0)).toEqual([]);
    });
  });
});
