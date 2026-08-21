import { Permission } from '@kabootar/shared';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Permissions } from '../../../common/decorators/auth.decorators';
import { RawResponse } from '../../../common/decorators/raw-response.decorator';
import { ReportsService } from '../application/reports.service';
import { LandingTimeReportQueryDto, TournamentResultReportQueryDto } from './dto/report-query.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('tournaments/:tournamentId/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('tournament-result')
  @RawResponse()
  @Permissions(Permission.TOURNAMENTS_READ)
  downloadTournamentResult(
    @Param('tournamentId') tournamentId: string,
    @Query() query: TournamentResultReportQueryDto,
  ) {
    return this.reportsService
      .downloadTournamentResultPdf(tournamentId, query.scope, query.raceDayId, query.participantId)
      .then((report) => report.file);
  }

  @Get('participant-list')
  @RawResponse()
  @Permissions(Permission.TOURNAMENTS_READ)
  downloadParticipantList(@Param('tournamentId') tournamentId: string) {
    return this.reportsService
      .downloadParticipantListExcel(tournamentId)
      .then((report) => report.file);
  }

  @Get('payments')
  @RawResponse()
  @Permissions(Permission.TOURNAMENTS_READ)
  downloadPaymentReport(@Param('tournamentId') tournamentId: string) {
    return this.reportsService
      .downloadPaymentReportExcel(tournamentId)
      .then((report) => report.file);
  }

  @Get('prizes')
  @RawResponse()
  @Permissions(Permission.TOURNAMENTS_READ)
  downloadPrizeReport(@Param('tournamentId') tournamentId: string) {
    return this.reportsService.downloadPrizeReportPdf(tournamentId).then((report) => report.file);
  }

  @Get('landing-times')
  @RawResponse()
  @Permissions(Permission.TOURNAMENTS_READ)
  downloadLandingTimeReport(
    @Param('tournamentId') tournamentId: string,
    @Query() query: LandingTimeReportQueryDto,
  ) {
    return this.reportsService
      .downloadLandingTimeReportExcel(tournamentId, query.raceDayId)
      .then((report) => report.file);
  }
}
