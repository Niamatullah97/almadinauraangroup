export function getRemainingRegistrationPigeonSlots(
  assignedCount: number,
  existingCount: number,
): number {
  return Math.max(0, assignedCount - existingCount);
}

export function assertRegistrationPigeonLimit(
  assignedCount: number,
  existingCount: number,
  addingCount: number,
): void {
  const remaining = getRemainingRegistrationPigeonSlots(assignedCount, existingCount);

  if (addingCount <= 0) {
    throw new Error('At least one pigeon must be added');
  }

  if (addingCount > remaining) {
    throw new Error(
      `Pigeon limit exceeded. Only ${remaining} slot(s) remaining for this registration`,
    );
  }
}

export function generateBulkRingNumber(
  prefix: string,
  tournamentId: string,
  participantId: string,
  pigeonNumber: number,
): string {
  const tournamentPart = tournamentId.slice(0, 6).toUpperCase();
  const participantPart = participantId.slice(0, 6).toUpperCase();
  const normalizedPrefix = prefix.trim().toUpperCase() || 'PK';
  return `${normalizedPrefix}-${tournamentPart}-${participantPart}-${String(pigeonNumber).padStart(3, '0')}`;
}

export function getNextPigeonNumber(existingNumbers: number[]): number {
  if (existingNumbers.length === 0) return 1;
  return Math.max(...existingNumbers) + 1;
}

export function buildQuotaPigeonNumbers(quota: number): number[] {
  if (quota < 1) return [];
  return Array.from({ length: quota }, (_, index) => index + 1);
}
