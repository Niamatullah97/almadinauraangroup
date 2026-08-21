import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '../../../common/decorators/auth.decorators';
import { RegistrationsService } from '../application/registrations.service';
import { FeePreviewQueryDto } from './dto/fee-preview-query.dto';

@ApiTags('Registrations')
@Controller('tournaments/:tournamentId/registrations')
export class TournamentRegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Public()
  @Get('fee-preview')
  previewFee(
    @Param('tournamentId') tournamentId: string,
    @Query() query: FeePreviewQueryDto,
  ) {
    return this.registrationsService.previewFee(
      tournamentId,
      query.pigeonCount,
      query.excludeRegistrationId,
    );
  }
}
