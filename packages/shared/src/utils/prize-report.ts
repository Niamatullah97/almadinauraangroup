import { PrizeDistributionRow } from '../types/report';

export const DEFAULT_PRIZE_SPLITS = [0.5, 0.3, 0.2] as const;

export interface PrizeCandidate {
  rank: number;
  participantName: string;
  loftName: string;
}

export function calculatePrizeDistribution(
  prizePool: number,
  winners: PrizeCandidate[],
  splits: readonly number[] = DEFAULT_PRIZE_SPLITS,
): PrizeDistributionRow[] {
  if (prizePool <= 0 || winners.length === 0) {
    return [];
  }

  const applicableSplits = splits.slice(0, winners.length);
  const splitTotal = applicableSplits.reduce((sum, value) => sum + value, 0);

  return winners.map((winner, index) => {
    const percentage = applicableSplits[index] ?? 0;
    const normalized = splitTotal > 0 ? percentage / splitTotal : 0;

    return {
      rank: winner.rank,
      participantName: winner.participantName,
      loftName: winner.loftName,
      prizeAmount: Math.round(prizePool * normalized),
      percentage: Math.round(normalized * 1000) / 10,
    };
  });
}
