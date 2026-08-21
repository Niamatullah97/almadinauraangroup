import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '../../../common/decorators/auth.decorators';
import { ResultsService } from '../application/results.service';

@ApiTags('Results')
@Controller('tournaments/:tournamentId')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Public()
  @Get('results')
  getTotalResults(@Param('tournamentId') tournamentId: string) {
    return this.resultsService.getTotalResults(tournamentId);
  }

  @Public()
  @Get('results/double-stamp')
  getTotalDoubleStampResults(@Param('tournamentId') tournamentId: string) {
    return this.resultsService.getTotalDoubleStampResults(tournamentId);
  }

  @Public()
  @Get('race-days/:raceDayId/results')
  getDailyResults(
    @Param('tournamentId') tournamentId: string,
    @Param('raceDayId') raceDayId: string,
  ) {
    return this.resultsService.getDailyResults(tournamentId, raceDayId);
  }

  @Public()
  @Get('race-days/:raceDayId/results/double-stamp')
  getDailyDoubleStampResults(
    @Param('tournamentId') tournamentId: string,
    @Param('raceDayId') raceDayId: string,
  ) {
    return this.resultsService.getDailyDoubleStampResults(tournamentId, raceDayId);
  }
}
