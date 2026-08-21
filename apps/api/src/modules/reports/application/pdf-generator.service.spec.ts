import { PdfGeneratorService } from './pdf-generator.service';

const emptySummary = { totalPigeons: 10, landedPigeons: 8, remainingPigeons: 2 };

describe('PdfGeneratorService', () => {
  let service: PdfGeneratorService;

  beforeEach(() => {
    service = new PdfGeneratorService();
  });

  it('builds a complete tournament result PDF with branding', async () => {
    const buffer = await service.buildTournamentResultPdf({
      tournamentTitle: 'Spring Cup',
      city: 'Lahore',
      documentTitle: 'Complete Tournament Results',
      sections: [
        {
          kind: 'daily',
          title: 'Race Day · 1 April 2026',
          subtitle: 'Release 06:30',
          summary: emptySummary,
          loftsCount: 1,
          firstWinner: null,
          lastWinner: null,
          averageWinner: null,
          rankings: [
            {
              participantId: 'p1',
              participantName: 'Ali',
              loftName: 'Sky Loft',
              rank: 1,
              totalPigeons: 2,
              landedPigeons: 2,
              remainingPigeons: 0,
              totalLandingTimeMs: 3600000,
              averageLandingTimeMs: 1800000,
              currentFlyingTimeMs: null,
              pigeons: [
                {
                  registrationPigeonId: 'rp1',
                  participantId: 'p1',
                  pigeonNumber: 1,
                  ringNumber: 'PK-1',
                  isDoubleStamp: false,
                  isBrave: false,
                  landingTimeMs: 1800000,
                  landingClockTime: '07:00:00',
                },
                {
                  registrationPigeonId: 'rp2',
                  participantId: 'p1',
                  pigeonNumber: 2,
                  ringNumber: 'PK-2',
                  isDoubleStamp: true,
                  isBrave: true,
                  landingTimeMs: 1800000,
                  landingClockTime: '08:00:00',
                },
              ],
            },
          ],
        },
        {
          kind: 'loft-total',
          title: 'Total Average',
          subtitle: 'Combined loft totals',
          summary: emptySummary,
          loftsCount: 1,
          firstWinner: null,
          lastWinner: null,
          averageWinner: null,
          raceDates: ['2026-04-01'],
          rows: [
            {
              participantName: 'Ali',
              loftName: 'Sky Loft',
              pigeonCount: 2,
              dayTotalsMs: { '2026-04-01': 3600000 },
              totalMs: 3600000,
            },
          ],
        },
        {
          kind: 'loft-total',
          title: 'Double Stamp Total',
          subtitle: 'Double stamp pigeons only',
          summary: { totalPigeons: 1, landedPigeons: 1, remainingPigeons: 0 },
          loftsCount: 1,
          firstWinner: null,
          lastWinner: null,
          averageWinner: null,
          raceDates: ['2026-04-01'],
          rows: [
            {
              participantName: 'Ali',
              loftName: 'Sky Loft',
              pigeonCount: 1,
              dayTotalsMs: { '2026-04-01': 1800000 },
              totalMs: 1800000,
            },
          ],
        },
      ],
    });

    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(500);
  });

  it('builds a prize report PDF buffer', async () => {
    const buffer = await service.buildPrizeReportPdf({
      tournamentTitle: 'Spring Cup',
      city: 'Lahore',
      prizePool: 100000,
      distributions: [
        {
          rank: 1,
          participantName: 'Ali',
          loftName: 'Sky Loft',
          prizeAmount: 50000,
          percentage: 50,
        },
      ],
    });

    const pdf = buffer.toString('latin1');
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(500);
    expect(pdf).toContain('/Type /Catalog');
  });
});
