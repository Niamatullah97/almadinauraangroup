import { Injectable } from '@nestjs/common';
import { Workbook, Row, Worksheet } from 'exceljs';
import { PrizeDistributionRow } from '@kabootar/shared';

import { formatCurrency, formatDateLabel } from '../infrastructure/report-format';

export interface ParticipantListRow {
  participantName: string;
  fatherName: string;
  phone: string;
  city: string;
  loftName: string;
  pigeonCount: number;
  totalFee: number;
  paidAmount: number;
  paymentStatus: string;
  receiptNumber: string;
}

export interface PaymentReportRow {
  receiptNumber: string;
  participantName: string;
  loftName: string;
  pigeonCount: number;
  totalFee: number;
  paidAmount: number;
  balance: number;
  paymentStatus: string;
  lastPaymentAt: string | null;
}

export interface LandingTimeReportRow {
  participantName: string;
  loftName: string;
  pigeonNumber: number;
  ringNumber: string;
  landingTime: string | null;
}

@Injectable()
export class ExcelGeneratorService {
  async buildParticipantListExcel(
    tournamentTitle: string,
    rows: ParticipantListRow[],
  ): Promise<Buffer> {
    return this.createWorkbookBuffer('Participants', (sheet) => {
      sheet.addRow([tournamentTitle]);
      sheet.addRow(['Participant List']);
      sheet.addRow([]);

      const headerRow = sheet.addRow([
        'Participant',
        'Father name',
        'Phone',
        'City',
        'Loft',
        'Pigeons',
        'Total fee',
        'Paid',
        'Status',
        'Receipt',
      ]);
      this.styleHeaderRow(headerRow);

      rows.forEach((row) => {
        sheet.addRow([
          row.participantName,
          row.fatherName,
          row.phone,
          row.city,
          row.loftName,
          row.pigeonCount,
          row.totalFee,
          row.paidAmount,
          row.paymentStatus,
          row.receiptNumber,
        ]);
      });

      sheet.getColumn(7).numFmt = '#,##0';
      sheet.getColumn(8).numFmt = '#,##0';
      this.autoFitColumns(sheet);
    });
  }

  async buildPaymentReportExcel(
    tournamentTitle: string,
    rows: PaymentReportRow[],
    totals: { totalFee: number; paidAmount: number; balance: number },
  ): Promise<Buffer> {
    return this.createWorkbookBuffer('Payments', (sheet) => {
      sheet.addRow([tournamentTitle]);
      sheet.addRow(['Payment Report']);
      sheet.addRow([
        'Totals',
        '',
        '',
        '',
        '',
        totals.totalFee,
        totals.paidAmount,
        totals.balance,
      ]);
      sheet.addRow([]);

      const headerRow = sheet.addRow([
        'Receipt',
        'Participant',
        'Loft',
        'Pigeons',
        'Total fee',
        'Paid',
        'Balance',
        'Status',
        'Last payment',
      ]);
      this.styleHeaderRow(headerRow);

      rows.forEach((row) => {
        sheet.addRow([
          row.receiptNumber,
          row.participantName,
          row.loftName,
          row.pigeonCount,
          row.totalFee,
          row.paidAmount,
          row.balance,
          row.paymentStatus,
          row.lastPaymentAt ?? '—',
        ]);
      });

      sheet.getColumn(5).numFmt = '#,##0';
      sheet.getColumn(6).numFmt = '#,##0';
      sheet.getColumn(7).numFmt = '#,##0';
      this.autoFitColumns(sheet);
    });
  }

  async buildLandingTimeReportExcel(
    tournamentTitle: string,
    raceDate: string,
    releaseTime: string,
    rows: LandingTimeReportRow[],
  ): Promise<Buffer> {
    return this.createWorkbookBuffer('Landing Times', (sheet) => {
      sheet.addRow([tournamentTitle]);
      sheet.addRow(['Landing Time Report']);
      sheet.addRow([`Race day: ${formatDateLabel(raceDate)} · Release ${releaseTime}`]);
      sheet.addRow([]);

      const headerRow = sheet.addRow([
        'Participant',
        'Loft',
        'Pigeon #',
        'Ring #',
        'Landing time',
      ]);
      this.styleHeaderRow(headerRow);

      rows.forEach((row) => {
        sheet.addRow([
          row.participantName,
          row.loftName,
          row.pigeonNumber,
          row.ringNumber,
          row.landingTime ?? '—',
        ]);
      });

      this.autoFitColumns(sheet);
    });
  }

  async buildPrizeReportExcel(
    tournamentTitle: string,
    prizePool: number,
    rows: PrizeDistributionRow[],
  ): Promise<Buffer> {
    return this.createWorkbookBuffer('Prizes', (sheet) => {
      sheet.addRow([tournamentTitle]);
      sheet.addRow(['Prize Distribution']);
      sheet.addRow([`Prize pool: ${formatCurrency(prizePool)}`]);
      sheet.addRow([]);

      const headerRow = sheet.addRow(['Rank', 'Participant', 'Loft', 'Share %', 'Prize amount']);
      this.styleHeaderRow(headerRow);

      rows.forEach((row) => {
        sheet.addRow([
          row.rank,
          row.participantName,
          row.loftName,
          row.percentage,
          row.prizeAmount,
        ]);
      });

      sheet.getColumn(5).numFmt = '#,##0';
      this.autoFitColumns(sheet);
    });
  }

  private async createWorkbookBuffer(
    sheetName: string,
    build: (sheet: Worksheet) => void,
  ): Promise<Buffer> {
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet(sheetName);
    build(sheet);
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private styleHeaderRow(row: Row): void {
    row.font = { bold: true, color: { argb: 'FF0F172A' } };
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };
  }

  private autoFitColumns(sheet: Worksheet): void {
    sheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const value = cell.value?.toString() ?? '';
        maxLength = Math.max(maxLength, value.length + 2);
      });
      column.width = Math.min(maxLength, 40);
    });
  }
}
