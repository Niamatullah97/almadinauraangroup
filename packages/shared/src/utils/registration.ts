export function calculateRegistrationTotalFee(
  entryFeePerPigeon: number,
  pigeonCount: number,
): number {
  return Number((entryFeePerPigeon * pigeonCount).toFixed(2));
}

export function deriveRegistrationPaymentStatus(
  totalFee: number,
  paidAmount: number,
): 'PENDING' | 'PARTIAL' | 'PAID' {
  if (paidAmount <= 0) return 'PENDING';
  if (paidAmount >= totalFee) return 'PAID';
  return 'PARTIAL';
}

export function generateReceiptNumber(year: number, sequence: number): string {
  return `RCP-${year}-${String(sequence).padStart(6, '0')}`;
}
