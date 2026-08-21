import { ReportResultScope } from '@kabootar/shared';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: {
    tournament: { findFirst: jest.Mock };
    tournamentRegistration: { findMany: jest.Mock };
  };
  let resultsService: {
    getTotalResults: jest.Mock;
    getDailyResults: jest.Mock;
    getCompleteResults: jest.Mock;
  };
  let landingTimesService: { getEntrySheet: jest.Mock };
  let pdfGenerator: { buildTournamentResultPdf: jest.Mock; buildPrizeReportPdf: jest.Mock };
  let excelGenerator: {
    buildParticipantListExcel: jest.Mock;
    buildPaymentReportExcel: jest.Mock;
    buildLandingTimeReportExcel: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      tournament: { findFirst: jest.fn() },
      tournamentRegistration: { findMany: jest.fn() },
    };
    resultsService = {
      getTotalResults: jest.fn(),
      getDailyResults: jest.fn(),
      getCompleteResults: jest.fn(),
    };
    landingTimesService = { getEntrySheet: jest.fn() };
    pdfGenerator = {
      buildTournamentResultPdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4')),
      buildPrizeReportPdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4')),
    };
    excelGenerator = {
      buildParticipantListExcel: jest.fn().mockResolvedValue(Buffer.from('PK')),
      buildPaymentReportExcel: jest.fn().mockResolvedValue(Buffer.from('PK')),
      buildLandingTimeReportExcel: jest.fn().mockResolvedValue(Buffer.from('PK')),
    };

    service = new ReportsService(
      prisma as never,
      resultsService as never,
      landingTimesService as never,
      pdfGenerator as never,
      excelGenerator as never,
    );
  });

  it('generates complete tournament result PDF', async () => {
    prisma.tournament.findFirst.mockResolvedValue({
      id: 't1',
      title: 'Spring Cup',
      city: 'Lahore',
    });
    resultsService.getCompleteResults.mockResolvedValue({
      raceDays: [
        {
          daily: {
            raceDayId: 'rd1',
            raceDate: '2026-04-01',
            releaseTime: '06:30',
            summary: { totalPigeons: 10, landedPigeons: 8, remainingPigeons: 2 },
            firstWinner: null,
            lastWinner: null,
            averageWinner: null,
            rankings: [],
          },
          doubleStamp: {
            scope: 'daily',
            raceDayId: 'rd1',
            summary: { totalPigeons: 0, landedPigeons: 0, remainingPigeons: 0 },
            firstWinner: null,
            lastWinner: null,
            averageWinner: null,
            rankings: [],
          },
        },
      ],
      total: {
        raceDayCount: 1,
        summary: { totalPigeons: 10, landedPigeons: 8, remainingPigeons: 2 },
        firstWinner: null,
        lastWinner: null,
        averageWinner: null,
        rankings: [],
      },
      doubleStampTotal: {
        scope: 'total',
        summary: { totalPigeons: 0, landedPigeons: 0, remainingPigeons: 0 },
        firstWinner: null,
        lastWinner: null,
        averageWinner: null,
        rankings: [],
      },
    });

    const report = await service.downloadTournamentResultPdf('t1', ReportResultScope.COMPLETE);

    expect(resultsService.getCompleteResults).toHaveBeenCalledWith('t1');
    expect(pdfGenerator.buildTournamentResultPdf).toHaveBeenCalled();
    expect(report.filename).toBe('spring-cup-complete-results.pdf');
    expect(report.file).toBeDefined();
  });

  it('generates complete tournament result PDF for total scope', async () => {
    prisma.tournament.findFirst.mockResolvedValue({
      id: 't1',
      title: 'Spring Cup',
      city: 'Lahore',
    });
    resultsService.getCompleteResults.mockResolvedValue({
      raceDays: [],
      total: {
        raceDayCount: 0,
        summary: { totalPigeons: 0, landedPigeons: 0, remainingPigeons: 0 },
        firstWinner: null,
        lastWinner: null,
        averageWinner: null,
        rankings: [],
      },
      doubleStampTotal: {
        scope: 'total',
        summary: { totalPigeons: 0, landedPigeons: 0, remainingPigeons: 0 },
        firstWinner: null,
        lastWinner: null,
        averageWinner: null,
        rankings: [],
      },
    });

    const report = await service.downloadTournamentResultPdf('t1', ReportResultScope.TOTAL);

    expect(pdfGenerator.buildTournamentResultPdf).toHaveBeenCalled();
    expect(report.filename).toBe('spring-cup-complete-results.pdf');
  });

  it('generates daily race day result PDF', async () => {
    prisma.tournament.findFirst.mockResolvedValue({
      id: 't1',
      title: 'Spring Cup',
      city: 'Lahore',
    });
    resultsService.getDailyResults.mockResolvedValue({
      raceDayId: 'rd1',
      raceDate: '2026-04-01',
      releaseTime: '06:30',
      summary: { totalPigeons: 10, landedPigeons: 8, remainingPigeons: 2 },
      firstWinner: null,
      lastWinner: null,
      averageWinner: null,
      rankings: [],
    });

    const report = await service.downloadTournamentResultPdf('t1', ReportResultScope.DAILY, 'rd1');

    expect(resultsService.getDailyResults).toHaveBeenCalledWith('t1', 'rd1');
    expect(report.filename).toBe('spring-cup-2026-04-01-results.pdf');
  });

  it('requires raceDayId for daily tournament result PDF', async () => {
    prisma.tournament.findFirst.mockResolvedValue({
      id: 't1',
      title: 'Spring Cup',
      city: 'Lahore',
    });

    await expect(
      service.downloadTournamentResultPdf('t1', ReportResultScope.DAILY),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('generates an overall report for one participant', async () => {
    prisma.tournament.findFirst.mockResolvedValue({
      id: 't1',
      title: 'Spring Cup',
      city: 'Lahore',
    });
    const participantRow = {
      participantId: 'p1',
      participantName: 'Ali',
      loftName: 'Sky Loft',
      profileImage: null,
      rank: 1,
      totalPigeons: 2,
      landedPigeons: 2,
      remainingPigeons: 0,
      totalLandingTimeMs: 7200000,
      currentFlyingTimeMs: null,
      pigeons: [],
    };
    resultsService.getCompleteResults.mockResolvedValue({
      raceDays: [
        {
          daily: {
            raceDayId: 'rd1',
            raceDate: '2026-04-01',
            releaseTime: '06:30',
            summary: { totalPigeons: 2, landedPigeons: 2, remainingPigeons: 0 },
            firstWinner: null,
            lastWinner: null,
            averageWinner: null,
            rankings: [participantRow],
          },
          doubleStamp: {
            scope: 'daily',
            raceDayId: 'rd1',
            summary: { totalPigeons: 0, landedPigeons: 0, remainingPigeons: 0 },
            firstWinner: null,
            lastWinner: null,
            averageWinner: null,
            rankings: [],
          },
        },
      ],
      total: {
        raceDayCount: 1,
        summary: { totalPigeons: 2, landedPigeons: 2, remainingPigeons: 0 },
        firstWinner: null,
        lastWinner: null,
        averageWinner: null,
        rankings: [participantRow],
      },
      doubleStampTotal: {
        scope: 'total',
        summary: { totalPigeons: 0, landedPigeons: 0, remainingPigeons: 0 },
        firstWinner: null,
        lastWinner: null,
        averageWinner: null,
        rankings: [],
      },
    });

    const report = await service.downloadTournamentResultPdf(
      't1',
      ReportResultScope.PARTICIPANT,
      undefined,
      'p1',
    );

    expect(pdfGenerator.buildTournamentResultPdf).toHaveBeenCalled();
    expect(report.filename).toBe('spring-cup-ali-results.pdf');
  });

  it('generates participant list excel', async () => {
    prisma.tournament.findFirst.mockResolvedValue({
      id: 't1',
      title: 'Spring Cup',
      city: 'Lahore',
    });
    prisma.tournamentRegistration.findMany.mockResolvedValue([
      {
        pigeonCount: 5,
        totalFee: 5000,
        paidAmount: 5000,
        paymentStatus: 'PAID',
        receiptNumber: 'RCPT-1',
        participant: {
          name: 'Ali',
          fatherName: 'Ahmed',
          phone: '0300',
          city: 'Lahore',
          loftName: 'Sky Loft',
        },
        payments: [],
      },
    ]);

    const report = await service.downloadParticipantListExcel('t1');

    expect(excelGenerator.buildParticipantListExcel).toHaveBeenCalledWith('Spring Cup', [
      expect.objectContaining({ participantName: 'Ali', pigeonCount: 5 }),
    ]);
    expect(report.filename).toBe('spring-cup-participants.xlsx');
  });

  it('generates landing time excel from entry sheet rows', async () => {
    prisma.tournament.findFirst.mockResolvedValue({
      id: 't1',
      title: 'Spring Cup',
      city: 'Lahore',
    });
    landingTimesService.getEntrySheet.mockResolvedValue({
      raceDate: '2026-04-01',
      releaseTime: '06:30',
      participants: [
        {
          participantName: 'Ali',
          loftName: 'Sky Loft',
          pigeons: [
            {
              pigeonNumber: 1,
              ringNumber: 'PK-1',
              landingTime: '08:15:00',
            },
          ],
        },
      ],
    });

    const report = await service.downloadLandingTimeReportExcel('t1', 'rd1');

    expect(excelGenerator.buildLandingTimeReportExcel).toHaveBeenCalled();
    expect(report.filename).toBe('spring-cup-landing-times.xlsx');
  });

  it('throws when tournament is missing', async () => {
    prisma.tournament.findFirst.mockResolvedValue(null);

    await expect(service.downloadPaymentReportExcel('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('generates payment report excel with totals', async () => {
    prisma.tournament.findFirst.mockResolvedValue({
      id: 't1',
      title: 'Spring Cup',
      city: 'Lahore',
    });
    prisma.tournamentRegistration.findMany.mockResolvedValue([
      {
        receiptNumber: 'RCPT-1',
        pigeonCount: 5,
        totalFee: 5000,
        paidAmount: 2500,
        paymentStatus: 'PARTIAL',
        participant: { name: 'Ali', loftName: 'Sky Loft' },
        payments: [{ paidAt: new Date('2026-04-01') }],
      },
    ]);

    const report = await service.downloadPaymentReportExcel('t1');

    expect(excelGenerator.buildPaymentReportExcel).toHaveBeenCalled();
    expect(report.filename).toBe('spring-cup-payments.xlsx');
  });

  it('generates prize report pdf from rankings and payments', async () => {
    prisma.tournament.findFirst.mockResolvedValue({
      id: 't1',
      title: 'Spring Cup',
      city: 'Lahore',
    });
    prisma.tournamentRegistration.findMany.mockResolvedValue([{ paidAmount: 100000 }]);
    resultsService.getTotalResults.mockResolvedValue({
      rankings: [
        {
          rank: 1,
          participantName: 'Ali',
          loftName: 'Sky Loft',
        },
      ],
    });

    const report = await service.downloadPrizeReportPdf('t1');

    expect(pdfGenerator.buildPrizeReportPdf).toHaveBeenCalled();
    expect(report.filename).toBe('spring-cup-prizes.pdf');
  });
});
