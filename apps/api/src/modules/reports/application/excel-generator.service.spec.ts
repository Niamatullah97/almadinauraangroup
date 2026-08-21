import { ExcelGeneratorService } from './excel-generator.service';

describe('ExcelGeneratorService', () => {
  let service: ExcelGeneratorService;

  beforeEach(() => {
    service = new ExcelGeneratorService();
  });

  it('builds participant list workbook buffer', async () => {
    const buffer = await service.buildParticipantListExcel('Spring Cup', [
      {
        participantName: 'Ali',
        fatherName: 'Ahmed',
        phone: '0300',
        city: 'Lahore',
        loftName: 'Sky Loft',
        pigeonCount: 5,
        totalFee: 5000,
        paidAmount: 5000,
        paymentStatus: 'Paid',
        receiptNumber: 'RCPT-1',
      },
    ]);

    expect(buffer.subarray(0, 2).toString()).toBe('PK');
  });

  it('builds payment report workbook buffer', async () => {
    const buffer = await service.buildPaymentReportExcel(
      'Spring Cup',
      [
        {
          receiptNumber: 'RCPT-1',
          participantName: 'Ali',
          loftName: 'Sky Loft',
          pigeonCount: 5,
          totalFee: 5000,
          paidAmount: 2500,
          balance: 2500,
          paymentStatus: 'Partial',
          lastPaymentAt: '2026-04-01T10:00:00.000Z',
        },
      ],
      { totalFee: 5000, paidAmount: 2500, balance: 2500 },
    );

    expect(buffer.subarray(0, 2).toString()).toBe('PK');
  });
});
