import {
  DailyResultDto,
  DoubleStampResultDto,
  formatClockDuration,
  formatWinnerValue,
  ParticipantResultRow,
  PrizeDistributionRow,
  PUBLIC_WEBSITE_HOST,
  ResultSummaryCounts,
  ResultWinner,
} from '@kabootar/shared';
import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');

import { resolvePdfArabicFontPath, resolvePdfLogoPath } from '../infrastructure/pdf-assets';
import {
  countUniqueLofts,
  formatCurrency,
  formatRaceDayLabel,
} from '../infrastructure/report-format';

const PURPLE = '#5b21b6';
const PURPLE_SOFT = '#f5f3ff';
const YELLOW = '#facc15';
const TEXT = '#0f172a';
const MUTED = '#475569';
const ARABIC_FONT = 'ReportArabic';

export interface ResultPdfDailySection {
  kind: 'daily';
  title: string;
  subtitle?: string;
  summary: ResultSummaryCounts;
  loftsCount: number;
  firstWinner: ResultWinner | null;
  lastWinner: ResultWinner | null;
  averageWinner: ResultWinner | null;
  rankings: ParticipantResultRow[];
}

export interface ResultPdfLoftTotalRow {
  participantName: string;
  loftName: string;
  pigeonCount: number;
  dayTotalsMs: Record<string, number>;
  totalMs: number;
}

export interface ResultPdfLoftTotalSection {
  kind: 'loft-total';
  title: string;
  subtitle?: string;
  summary: ResultSummaryCounts;
  loftsCount: number;
  firstWinner: ResultWinner | null;
  lastWinner: ResultWinner | null;
  averageWinner: ResultWinner | null;
  raceDates: string[];
  rows: ResultPdfLoftTotalRow[];
}

export type ResultPdfSection = ResultPdfDailySection | ResultPdfLoftTotalSection;

export interface TournamentResultPdfInput {
  tournamentTitle: string;
  city: string;
  documentTitle: string;
  sections: ResultPdfSection[];
}

export interface PrizeReportPdfInput {
  tournamentTitle: string;
  city: string;
  prizePool: number;
  distributions: PrizeDistributionRow[];
}

interface PdfTableColumn {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

interface PdfTableCell {
  text: string;
  badge?: string;
}

@Injectable()
export class PdfGeneratorService {
  async buildTournamentResultPdf(input: TournamentResultPdfInput): Promise<Buffer> {
    return this.createBuffer(
      (doc) => {
        this.writeDocumentHeading(doc, input.tournamentTitle, input.city);

        input.sections.forEach((section, index) => {
          if (index > 0) {
            doc.addPage();
            this.writeDocumentHeading(doc, input.tournamentTitle, input.city);
          }

          this.writeSection(doc, section);
        });
      },
      'landscape',
      input.documentTitle,
    );
  }

  async buildPrizeReportPdf(input: PrizeReportPdfInput): Promise<Buffer> {
    return this.createBuffer(
      (doc) => {
        this.writeDocumentHeading(doc, input.tournamentTitle, input.city);
        doc
          .font('Helvetica')
          .fontSize(11)
          .fillColor(MUTED)
          .text(`Prize pool: ${formatCurrency(input.prizePool)}`);
        doc.moveDown();

        if (input.distributions.length === 0) {
          doc.fontSize(11).fillColor('#64748b').text('No prize distribution available yet.');
          return;
        }

        const headers = ['Rank', 'Participant', 'Loft', 'Share', 'Prize'];
        const rows = input.distributions.map((row) => [
          String(row.rank),
          row.participantName,
          row.loftName,
          `${row.percentage}%`,
          formatCurrency(row.prizeAmount),
        ]);

        this.writeTable(doc, headers, rows);
      },
      'portrait',
      'Prize Report',
    );
  }

  private writeSection(doc: PDFKit.PDFDocument, section: ResultPdfSection): void {
    doc.font(this.headingFont(doc)).fontSize(14).fillColor(PURPLE).text(section.title);
    if (section.subtitle) {
      doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(section.subtitle);
    }
    doc.moveDown(0.4);

    this.writeSummaryLine(doc, section.summary, section.loftsCount);
    doc.moveDown(0.5);
    this.writeWinnerBars(doc, section);
    doc.moveDown(0.6);

    if (section.kind === 'daily') {
      this.writeDailyTimetable(doc, section.rankings);
      return;
    }

    this.writeLoftTotalTable(doc, section);
  }

  private writeDocumentHeading(doc: PDFKit.PDFDocument, title: string, city: string): void {
    doc.font(this.headingFont(doc)).fontSize(16).fillColor(TEXT).text(title);
    doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(city);
    doc.moveDown(0.6);
  }

  private writeBrandHeader(doc: PDFKit.PDFDocument, documentTitle: string): void {
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const top = 16;
    let textX = left;
    const logoPath = resolvePdfLogoPath();

    if (logoPath) {
      try {
        doc.image(logoPath, left, top, { fit: [36, 36] });
        textX = left + 46;
      } catch {
        textX = left;
      }
    }

    this.setFont(doc, PUBLIC_WEBSITE_HOST, true);
    doc
      .fontSize(12)
      .fillColor(PURPLE)
      .text(PUBLIC_WEBSITE_HOST, textX, top + 2, {
        width: right - textX,
      });
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(MUTED)
      .text(documentTitle, textX, top + 18, {
        width: right - textX,
      });

    doc.moveTo(left, 58).lineTo(right, 58).lineWidth(1.5).strokeColor(PURPLE).stroke();
    doc.y = doc.page.margins.top;
    doc.x = left;
  }

  private writeSummaryLine(
    doc: PDFKit.PDFDocument,
    summary: ResultSummaryCounts,
    loftsCount: number,
  ): void {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(TEXT)
      .text(
        `Lofts: ${loftsCount}    Total pigeons: ${summary.totalPigeons}    Pigeons landed: ${summary.landedPigeons}    Pigeons remaining: ${summary.remainingPigeons}`,
      );
  }

  private writeWinnerBars(
    doc: PDFKit.PDFDocument,
    section: Pick<ResultPdfSection, 'firstWinner' | 'lastWinner' | 'averageWinner'>,
  ): void {
    const innerWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const gap = 8;
    const barWidth = (innerWidth - gap * 2) / 3;
    const barHeight = 38;
    const y = doc.y;
    const items = [
      ['FIRST WINNER', section.firstWinner],
      ['LAST WINNER', section.lastWinner],
      ['AVERAGE WINNER', section.averageWinner],
    ] as const;

    items.forEach(([label, winner], index) => {
      const x = doc.page.margins.left + index * (barWidth + gap);
      doc.save();
      doc.roundedRect(x, y, barWidth, barHeight, 4).fill(PURPLE);
      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor('#e9d5ff')
        .text(label, x + 8, y + 6, {
          width: barWidth - 16,
        });
      const name = winner?.participantName ?? 'No winner yet';
      const value = winner ? formatWinnerValue(winner) : '';
      this.setFont(doc, name, true);
      doc
        .fontSize(9)
        .fillColor('#ffffff')
        .text(name, x + 8, y + 18, {
          width: barWidth - 88,
          lineBreak: false,
          ellipsis: true,
        });
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#ffffff')
        .text(value, x + 8, y + 18, {
          width: barWidth - 16,
          align: 'right',
        });
      doc.restore();
    });

    doc.y = y + barHeight;
    doc.x = doc.page.margins.left;
  }

  private writeDailyTimetable(doc: PDFKit.PDFDocument, rankings: ParticipantResultRow[]): void {
    if (rankings.length === 0) {
      doc.font('Helvetica').fontSize(11).fillColor('#64748b').text('No rankings available.');
      return;
    }

    const pigeonCount = rankings.reduce((max, row) => {
      const highest = row.pigeons.reduce(
        (pigeonMax, pigeon) => Math.max(pigeonMax, pigeon.pigeonNumber),
        0,
      );
      return Math.max(max, highest);
    }, 0);
    const pigeonNumbers = Array.from({ length: pigeonCount }, (_, index) => index + 1);
    const available = this.tableWidth(doc);
    const srWidth = 28;
    const totalWidth = 58;
    const nameWidth = Math.min(130, Math.max(90, available * 0.18));
    const remaining = Math.max(40, available - srWidth - nameWidth - totalWidth);
    const pigeonWidth = pigeonNumbers.length > 0 ? remaining / pigeonNumbers.length : remaining;

    const columns: PdfTableColumn[] = [
      { header: 'Sr', width: srWidth, align: 'center' },
      { header: 'Name', width: nameWidth },
      ...pigeonNumbers.map((number) => ({
        header: `Pigeon ${number}`,
        width: pigeonWidth,
        align: 'center' as const,
      })),
      { header: 'Total', width: totalWidth, align: 'center' },
    ];

    const rows: PdfTableCell[][] = rankings.map((row, index) => {
      const pigeonCells = pigeonNumbers.map((number) => {
        const pigeon = row.pigeons.find((item) => item.pigeonNumber === number);
        return {
          text:
            pigeon?.landingClockTime && pigeon.landingTimeMs !== null
              ? `${pigeon.landingClockTime}\n${formatClockDuration(pigeon.landingTimeMs)}`
              : '',
          badge:
            [
              pigeon?.isDoubleStamp && pigeon.landingClockTime ? 'Double stamp' : null,
              pigeon?.isBrave && pigeon.landingClockTime ? 'Bravery' : null,
            ]
              .filter(Boolean)
              .join(' · ') || undefined,
        };
      });

      return [
        { text: String(row.rank ?? index + 1) },
        { text: row.participantName || row.loftName },
        ...pigeonCells,
        {
          text: formatClockDuration(row.landedPigeons > 0 ? row.totalLandingTimeMs : 0),
        },
      ];
    });

    this.writeStyledTable(doc, columns, rows);
  }

  private writeLoftTotalTable(doc: PDFKit.PDFDocument, section: ResultPdfLoftTotalSection): void {
    if (section.rows.length === 0) {
      doc.font('Helvetica').fontSize(11).fillColor('#64748b').text('No rankings available.');
      return;
    }

    const available = this.tableWidth(doc);
    const srWidth = 28;
    const pigeonsWidth = 48;
    const totalWidth = 62;
    const nameWidth = Math.min(140, Math.max(90, available * 0.2));
    const remaining = Math.max(80, available - srWidth - nameWidth - pigeonsWidth - totalWidth);
    const dateWidth =
      section.raceDates.length > 0 ? remaining / section.raceDates.length : remaining;

    const columns: PdfTableColumn[] = [
      { header: 'Sr', width: srWidth, align: 'center' },
      { header: 'Name', width: nameWidth },
      { header: 'Pigeons', width: pigeonsWidth, align: 'center' },
      ...section.raceDates.map((raceDate) => ({
        header: raceDate,
        width: dateWidth,
        align: 'center' as const,
      })),
      { header: 'Total', width: totalWidth, align: 'center' },
    ];

    const rows: PdfTableCell[][] = section.rows.map((row, index) => [
      { text: String(index + 1) },
      { text: row.participantName || row.loftName },
      { text: String(row.pigeonCount) },
      ...section.raceDates.map((raceDate) => ({
        text: formatClockDuration(row.dayTotalsMs[raceDate] ?? 0),
      })),
      { text: formatClockDuration(row.totalMs) },
    ]);

    this.writeStyledTable(doc, columns, rows);
  }

  private writeStyledTable(
    doc: PDFKit.PDFDocument,
    columns: PdfTableColumn[],
    rows: PdfTableCell[][],
  ): void {
    const startX = doc.page.margins.left;
    const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
    const headerHeight = 18;
    const baseRowHeight = 16;

    const drawHeader = (): void => {
      this.ensureSpace(doc, headerHeight + 8);
      const y = doc.y;
      doc.save();
      doc.rect(startX, y, tableWidth, headerHeight).fill(PURPLE);
      columns.reduce((x, column) => {
        this.setFont(doc, column.header, true);
        doc
          .fontSize(7)
          .fillColor('#ffffff')
          .text(column.header, x + 2, y + 5, {
            width: column.width - 4,
            align: column.align ?? 'left',
            lineBreak: false,
          });
        return x + column.width;
      }, startX);
      doc.restore();
      doc.y = y + headerHeight;
      doc.x = startX;
    };

    drawHeader();

    rows.forEach((row, rowIndex) => {
      const rowHeight = row.some((cell) => cell.badge) ? 26 : baseRowHeight;
      if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        drawHeader();
      }

      const y = doc.y;
      if (rowIndex % 2 === 0) {
        doc.save();
        doc.rect(startX, y, tableWidth, rowHeight).fill(PURPLE_SOFT);
        doc.restore();
      }

      row.reduce((x, cell, columnIndex) => {
        const column = columns[columnIndex];
        this.setFont(doc, cell.text);
        doc
          .fontSize(7)
          .fillColor(TEXT)
          .text(cell.text, x + 2, y + 4, {
            width: column.width - 4,
            align: column.align ?? 'left',
            lineBreak: false,
            ellipsis: true,
          });
        if (cell.badge) {
          this.writeBadge(doc, cell.badge, x + 2, y + 14, column.width - 4);
        }
        return x + column.width;
      }, startX);

      doc.y = y + rowHeight;
      doc.x = startX;
    });
  }

  private writeBadge(
    doc: PDFKit.PDFDocument,
    label: string,
    x: number,
    y: number,
    width: number,
  ): void {
    const badgeWidth = Math.min(width, 54);
    doc.save();
    doc.roundedRect(x, y, badgeWidth, 9, 2).fill(YELLOW);
    doc
      .font('Helvetica-Bold')
      .fontSize(5)
      .fillColor('#78350f')
      .text(label, x, y + 1.5, {
        width: badgeWidth,
        align: 'center',
        lineBreak: false,
      });
    doc.restore();
  }

  private writeTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][]): void {
    const columnWidths = [45, 130, 110, 70, 90].slice(0, headers.length);
    this.writeStyledTable(
      doc,
      headers.map((header, index) => ({
        header,
        width: columnWidths[index] ?? 90,
      })),
      rows.map((row) => row.map((text) => ({ text }))),
    );
  }

  private tableWidth(doc: PDFKit.PDFDocument): number {
    return doc.page.width - doc.page.margins.left - doc.page.margins.right;
  }

  private ensureSpace(doc: PDFKit.PDFDocument, height: number): void {
    if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
  }

  private headingFont(doc: PDFKit.PDFDocument): string {
    return this.hasFont(doc, ARABIC_FONT) ? ARABIC_FONT : 'Helvetica-Bold';
  }

  private setFont(doc: PDFKit.PDFDocument, text: string, bold = false): void {
    if (this.hasArabic(text) && this.hasFont(doc, ARABIC_FONT)) {
      doc.font(ARABIC_FONT);
      return;
    }

    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
  }

  private hasArabic(text: string): boolean {
    return /[\u0600-\u06FF]/.test(text);
  }

  private hasFont(doc: PDFKit.PDFDocument, name: string): boolean {
    const fonts = (doc as unknown as { _fontFamilies?: Record<string, unknown> })._fontFamilies;
    return Boolean(fonts?.[name]);
  }

  private createBuffer(
    build: (doc: PDFKit.PDFDocument) => void,
    layout: 'portrait' | 'landscape',
    documentTitle: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout,
        margins: { top: 72, bottom: 36, left: 28, right: 28 },
      });
      const chunks: Buffer[] = [];
      const fontPath = resolvePdfArabicFontPath();

      if (fontPath) {
        try {
          doc.registerFont(ARABIC_FONT, fontPath);
        } catch {
          // Built-in Helvetica is used when the Arabic font cannot be registered.
        }
      }

      doc.on('pageAdded', () => {
        this.writeBrandHeader(doc, documentTitle);
      });
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.writeBrandHeader(doc, documentTitle);
      build(doc);
      doc.end();
    });
  }
}

export function buildDailyPdfSection(daily: DailyResultDto): ResultPdfDailySection {
  return {
    kind: 'daily',
    title: `Race Day · ${formatRaceDayLabel(daily.raceDate)}`,
    subtitle: `Release ${daily.releaseTime}`,
    summary: daily.summary,
    loftsCount: countUniqueLofts(daily.rankings.map((row) => row.loftName)),
    firstWinner: daily.firstWinner,
    lastWinner: daily.lastWinner,
    averageWinner: daily.averageWinner,
    rankings: daily.rankings,
  };
}

export function buildLoftTotalPdfSection(
  title: string,
  subtitle: string,
  result: Pick<
    DailyResultDto | DoubleStampResultDto,
    'summary' | 'firstWinner' | 'lastWinner' | 'averageWinner' | 'rankings'
  >,
  dailyResults: Array<{ raceDate: string; rankings: ParticipantResultRow[] }>,
): ResultPdfLoftTotalSection {
  const raceDates = dailyResults.map((day) => day.raceDate);
  const byParticipant = new Map<string, ResultPdfLoftTotalRow>();

  for (const row of result.rankings) {
    byParticipant.set(row.participantId, {
      participantName: row.participantName,
      loftName: row.loftName,
      pigeonCount: row.totalPigeons,
      dayTotalsMs: {},
      totalMs: 0,
    });
  }

  for (const day of dailyResults) {
    for (const row of day.rankings) {
      const current = byParticipant.get(row.participantId) ?? {
        participantName: row.participantName,
        loftName: row.loftName,
        pigeonCount: row.totalPigeons,
        dayTotalsMs: {},
        totalMs: 0,
      };
      current.dayTotalsMs[day.raceDate] = row.totalLandingTimeMs;
      current.totalMs += row.totalLandingTimeMs;
      current.pigeonCount = Math.max(current.pigeonCount, row.totalPigeons);
      byParticipant.set(row.participantId, current);
    }
  }

  const rows = [...byParticipant.values()].sort((left, right) => {
    if (left.totalMs !== right.totalMs) {
      return right.totalMs - left.totalMs;
    }
    return left.participantName.localeCompare(right.participantName);
  });

  return {
    kind: 'loft-total',
    title,
    subtitle,
    summary: result.summary,
    loftsCount: countUniqueLofts(rows.map((row) => row.loftName)),
    firstWinner: result.firstWinner,
    lastWinner: result.lastWinner,
    averageWinner: result.averageWinner,
    raceDates,
    rows,
  };
}
