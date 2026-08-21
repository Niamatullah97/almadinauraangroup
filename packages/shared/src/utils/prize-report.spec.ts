import { calculatePrizeDistribution } from './prize-report';

describe('calculatePrizeDistribution', () => {
  it('distributes prize pool across ranked winners', () => {
    const rows = calculatePrizeDistribution(100000, [
      { rank: 1, participantName: 'Ali', loftName: 'Sky Loft' },
      { rank: 2, participantName: 'Bilal', loftName: 'Star Loft' },
      { rank: 3, participantName: 'Carlos', loftName: 'North Loft' },
    ]);

    expect(rows).toEqual([
      {
        rank: 1,
        participantName: 'Ali',
        loftName: 'Sky Loft',
        prizeAmount: 50000,
        percentage: 50,
      },
      {
        rank: 2,
        participantName: 'Bilal',
        loftName: 'Star Loft',
        prizeAmount: 30000,
        percentage: 30,
      },
      {
        rank: 3,
        participantName: 'Carlos',
        loftName: 'North Loft',
        prizeAmount: 20000,
        percentage: 20,
      },
    ]);
  });

  it('returns empty rows when prize pool is zero', () => {
    expect(calculatePrizeDistribution(0, [{ rank: 1, participantName: 'Ali', loftName: 'Sky' }])).toEqual(
      [],
    );
  });
});
