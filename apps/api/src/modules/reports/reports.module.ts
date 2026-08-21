import { Module } from '@nestjs/common';

import { LandingTimesModule } from '../landing-times/landing-times.module';
import { ResultsModule } from '../results/results.module';
import { ExcelGeneratorService } from './application/excel-generator.service';
import { PdfGeneratorService } from './application/pdf-generator.service';
import { ReportsService } from './application/reports.service';
import { ReportsController } from './presentation/reports.controller';

@Module({
  imports: [ResultsModule, LandingTimesModule],
  controllers: [ReportsController],
  providers: [ReportsService, PdfGeneratorService, ExcelGeneratorService],
})
export class ReportsModule {}
