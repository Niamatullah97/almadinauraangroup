import {
  DailyResultDto,
  DoubleStampResultDto,
  REGISTRATION_PAYMENT_STATUS_LABELS,
  ReportResultScope,
  TotalResultDto,
  calculatePrizeDistribution,
} from '@kabootar/shared';
import { BadRequestException, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.module';
import { LandingTimesService } from '../../landing-times/application/landing-times.service';
import { ResultsService } from '../../results/application/results.service';
import { slugifyFilename } from '../infrastructure/report-format';
import { ExcelGeneratorService } from './excel-generator.service';
import {
  PdfGeneratorService,
  ResultPdfSection,
  buildDailyPdfSection,
  buildLoftTotalPdfSection,
} from './pdf-generator.service';

export interface GeneratedReportFile {
  file: StreamableFile;
  filename: string;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resultsService: ResultsService,
    private readonly landingTimesService: LandingTimesService,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly excelGenerator: ExcelGeneratorService,
  ) {}

  async downloadTournamentResultPdf(
    tournamentId: string,
    scope: ReportResultScope,
    raceDayId?: string,
    participantId?: string,
  ): Promise<GeneratedReportFile> {
    const tournament = await this.getTournamentOrThrow(tournamentId);

    if (scope === ReportResultScope.DAILY && !raceDayId) {
      throw new BadRequestException('raceDayId is required for daily tournament result reports');
    }

    if (scope === ReportResultScope.PARTICIPANT && !participantId) {
      throw new BadRequestException(
        'participantId is required for participant tournament result reports',
      );
    }

    if (scope === ReportResultScope.DAILY) {
      const daily = await this.resultsService.getDailyResults(tournamentId, raceDayId!);
      const buffer = await this.pdfGenerator.buildTournamentResultPdf({
        tournamentTitle: tournament.title,
        city: tournament.city,
        documentTitle: 'Race Day Results',
        sections: [buildDailyPdfSection(daily)],
      });

      return this.toPdfFile(
        buffer,
        `${slugifyFilename(tournament.title)}-${daily.raceDate}-results.pdf`,
      );
    }

    const bundle = await this.resultsService.getCompleteResults(tournamentId);
    const dailyResults = bundle.raceDays.map((item) => item.daily);
    const doubleStampDays = bundle.raceDays.map((item) => ({
      raceDate: item.daily.raceDate,
      rankings: item.doubleStamp.rankings,
    }));

    if (scope === ReportResultScope.PARTICIPANT) {
      const participant = bundle.total.rankings.find((row) => row.participantId === participantId);

      if (!participant) {
        throw new NotFoundException('Participant tournament results not found');
      }

      const participantDailyResults = dailyResults.map((daily) =>
        filterResultForParticipant(daily, participantId!),
      );
      const participantTotal = filterResultForParticipant(bundle.total, participantId!);
      const participantDoubleStamp = filterResultForParticipant(
        bundle.doubleStampTotal,
        participantId!,
      );
      const participantDoubleStampDays = bundle.raceDays.map((item) => ({
        raceDate: item.daily.raceDate,
        rankings: item.doubleStamp.rankings.filter((row) => row.participantId === participantId),
      }));
      const sections: ResultPdfSection[] = [
        ...participantDailyResults.map((daily) => buildDailyPdfSection(daily)),
        buildLoftTotalPdfSection(
          'Participant Tournament Total',
          'Combined result across every race day',
          participantTotal,
          participantDailyResults,
        ),
      ];

      if (participantDoubleStamp.rankings.length > 0) {
        sections.push(
          buildLoftTotalPdfSection(
            'Participant Double Stamp Total',
            'Double stamp pigeons across every race day',
            participantDoubleStamp,
            participantDoubleStampDays,
          ),
        );
      }

      const buffer = await this.pdfGenerator.buildTournamentResultPdf({
        tournamentTitle: tournament.title,
        city: tournament.city,
        documentTitle: `${participant.participantName} Tournament Results`,
        sections,
      });

      return this.toPdfFile(
        buffer,
        `${slugifyFilename(tournament.title)}-${slugifyFilename(participant.participantName)}-results.pdf`,
      );
    }

    const buffer = await this.pdfGenerator.buildTournamentResultPdf({
      tournamentTitle: tournament.title,
      city: tournament.city,
      documentTitle: 'Complete Tournament Results',
      sections: [
        ...dailyResults.map((daily) => buildDailyPdfSection(daily)),
        buildLoftTotalPdfSection(
          'Total Average',
          'Combined loft totals across every race day',
          bundle.total,
          dailyResults,
        ),
        buildLoftTotalPdfSection(
          'Double Stamp Total',
          'Double stamp pigeons only, with a separate total for each loft',
          bundle.doubleStampTotal,
          doubleStampDays,
        ),
      ],
    });

    return this.toPdfFile(buffer, `${slugifyFilename(tournament.title)}-complete-results.pdf`);
  }

  async downloadParticipantListExcel(tournamentId: string): Promise<GeneratedReportFile> {
    const tournament = await this.getTournamentOrThrow(tournamentId);
    const registrations = await this.getRegistrationsForReport(tournamentId);

    const rows = registrations.map((registration) => ({
      participantName: registration.participant.name,
      fatherName: registration.participant.fatherName,
      phone: registration.participant.phone,
      city: registration.participant.city,
      loftName: registration.participant.loftName,
      pigeonCount: registration.pigeonCount,
      totalFee: Number(registration.totalFee),
      paidAmount: Number(registration.paidAmount),
      paymentStatus:
        REGISTRATION_PAYMENT_STATUS_LABELS[registration.paymentStatus] ??
        registration.paymentStatus,
      receiptNumber: registration.receiptNumber,
    }));

    const buffer = await this.excelGenerator.buildParticipantListExcel(tournament.title, rows);
    return this.toExcelFile(buffer, `${slugifyFilename(tournament.title)}-participants.xlsx`);
  }

  async downloadPaymentReportExcel(tournamentId: string): Promise<GeneratedReportFile> {
    const tournament = await this.getTournamentOrThrow(tournamentId);
    const registrations = await this.getRegistrationsForReport(tournamentId);

    const rows = registrations.map((registration) => {
      const totalFee = Number(registration.totalFee);
      const paidAmount = Number(registration.paidAmount);
      const lastPayment = registration.payments[0];

      return {
        receiptNumber: registration.receiptNumber,
        participantName: registration.participant.name,
        loftName: registration.participant.loftName,
        pigeonCount: registration.pigeonCount,
        totalFee,
        paidAmount,
        balance: Math.max(0, totalFee - paidAmount),
        paymentStatus:
          REGISTRATION_PAYMENT_STATUS_LABELS[registration.paymentStatus] ??
          registration.paymentStatus,
        lastPaymentAt: lastPayment ? lastPayment.paidAt.toISOString() : null,
      };
    });

    const totals = rows.reduce(
      (summary, row) => ({
        totalFee: summary.totalFee + row.totalFee,
        paidAmount: summary.paidAmount + row.paidAmount,
        balance: summary.balance + row.balance,
      }),
      { totalFee: 0, paidAmount: 0, balance: 0 },
    );

    const buffer = await this.excelGenerator.buildPaymentReportExcel(
      tournament.title,
      rows,
      totals,
    );

    return this.toExcelFile(buffer, `${slugifyFilename(tournament.title)}-payments.xlsx`);
  }

  async downloadPrizeReportPdf(tournamentId: string): Promise<GeneratedReportFile> {
    const tournament = await this.getTournamentOrThrow(tournamentId);
    const [results, registrations] = await Promise.all([
      this.resultsService.getTotalResults(tournamentId),
      this.getRegistrationsForReport(tournamentId),
    ]);

    const prizePool = registrations.reduce(
      (sum, registration) => sum + Number(registration.paidAmount),
      0,
    );

    const winners = results.rankings
      .filter((row) => row.rank !== null)
      .slice(0, 3)
      .map((row) => ({
        rank: row.rank as number,
        participantName: row.participantName,
        loftName: row.loftName,
      }));

    const distributions = calculatePrizeDistribution(prizePool, winners);
    const buffer = await this.pdfGenerator.buildPrizeReportPdf({
      tournamentTitle: tournament.title,
      city: tournament.city,
      prizePool,
      distributions,
    });

    return this.toPdfFile(buffer, `${slugifyFilename(tournament.title)}-prizes.pdf`);
  }

  async downloadLandingTimeReportExcel(
    tournamentId: string,
    raceDayId: string,
  ): Promise<GeneratedReportFile> {
    const tournament = await this.getTournamentOrThrow(tournamentId);
    const entrySheet = await this.landingTimesService.getEntrySheet(tournamentId, raceDayId);

    const rows = entrySheet.participants.flatMap((participant) =>
      participant.pigeons.map((pigeon) => ({
        participantName: participant.participantName,
        loftName: participant.loftName,
        pigeonNumber: pigeon.pigeonNumber,
        ringNumber: pigeon.ringNumber,
        landingTime: pigeon.landingTime,
      })),
    );

    const buffer = await this.excelGenerator.buildLandingTimeReportExcel(
      tournament.title,
      entrySheet.raceDate,
      entrySheet.releaseTime,
      rows,
    );

    return this.toExcelFile(buffer, `${slugifyFilename(tournament.title)}-landing-times.xlsx`);
  }

  private async getTournamentOrThrow(tournamentId: string) {
    const tournament = await this.prisma.tournament.findFirst({
      where: { id: tournamentId, deletedAt: null },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return tournament;
  }

  private async getRegistrationsForReport(tournamentId: string) {
    return this.prisma.tournamentRegistration.findMany({
      where: { tournamentId, deletedAt: null },
      include: {
        participant: true,
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private toPdfFile(buffer: Buffer, filename: string): GeneratedReportFile {
    return {
      filename,
      file: new StreamableFile(buffer, {
        type: 'application/pdf',
        disposition: `attachment; filename="${filename}"`,
      }),
    };
  }

  private toExcelFile(buffer: Buffer, filename: string): GeneratedReportFile {
    return {
      filename,
      file: new StreamableFile(buffer, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        disposition: `attachment; filename="${filename}"`,
      }),
    };
  }
}

function filterResultForParticipant<
  T extends DailyResultDto | TotalResultDto | DoubleStampResultDto,
>(result: T, participantId: string): T {
  const rankings = result.rankings.filter((row) => row.participantId === participantId);
  const row = rankings[0];

  return {
    ...result,
    rankings,
    summary: {
      totalPigeons: row?.totalPigeons ?? 0,
      landedPigeons: row?.landedPigeons ?? 0,
      remainingPigeons: row?.remainingPigeons ?? 0,
    },
    firstWinner: result.firstWinner?.participantId === participantId ? result.firstWinner : null,
    lastWinner: result.lastWinner?.participantId === participantId ? result.lastWinner : null,
    averageWinner:
      result.averageWinner?.participantId === participantId ? result.averageWinner : null,
  } as T;
}
