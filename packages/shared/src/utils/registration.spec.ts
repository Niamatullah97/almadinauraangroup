import {
  calculateRegistrationTotalFee,
  deriveRegistrationPaymentStatus,
  generateReceiptNumber,
} from './registration';

describe('registration utils', () => {
  describe('calculateRegistrationTotalFee', () => {
    it('charges the entry fee once per participant', () => {
      expect(calculateRegistrationTotalFee(500, 3)).toBe(500);
    });

    it('rounds to two decimal places', () => {
      expect(calculateRegistrationTotalFee(99.99, 3)).toBe(99.99);
    });
  });

  describe('deriveRegistrationPaymentStatus', () => {
    it('returns PENDING when nothing paid', () => {
      expect(deriveRegistrationPaymentStatus(1000, 0)).toBe('PENDING');
    });

    it('returns PARTIAL when partially paid', () => {
      expect(deriveRegistrationPaymentStatus(1000, 400)).toBe('PARTIAL');
    });

    it('returns PAID when fully paid', () => {
      expect(deriveRegistrationPaymentStatus(1000, 1000)).toBe('PAID');
    });

    it('returns PAID when overpaid', () => {
      expect(deriveRegistrationPaymentStatus(1000, 1200)).toBe('PAID');
    });
  });

  describe('generateReceiptNumber', () => {
    it('formats receipt number with padded sequence', () => {
      expect(generateReceiptNumber(2026, 42)).toBe('RCP-2026-000042');
    });
  });
});
