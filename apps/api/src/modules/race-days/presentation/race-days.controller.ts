import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@kabootar/shared';

import { Permissions, Public } from '../../../common/decorators/auth.decorators';
import { RaceDaysService } from '../application/race-days.service';
import { CreateRaceDayDto } from './dto/create-race-day.dto';
import { UpdateRaceDayDto } from './dto/update-race-day.dto';

@ApiTags('Race Days')
@Controller('tournaments/:tournamentId/race-days')
export class RaceDaysController {
  constructor(private readonly raceDaysService: RaceDaysService) {}

  @Public()
  @Get()
  findAll(@Param('tournamentId') tournamentId: string) {
    return this.raceDaysService.findAllByTournament(tournamentId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('tournamentId') tournamentId: string, @Param('id') id: string) {
    return this.raceDaysService.findOne(tournamentId, id);
  }

  @Post()
  @ApiBearerAuth()
  @Permissions(Permission.TOURNAMENTS_UPDATE)
  create(@Param('tournamentId') tournamentId: string, @Body() dto: CreateRaceDayDto) {
    return this.raceDaysService.create(tournamentId, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Permissions(Permission.TOURNAMENTS_UPDATE)
  update(
    @Param('tournamentId') tournamentId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRaceDayDto,
  ) {
    return this.raceDaysService.update(tournamentId, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Permissions(Permission.TOURNAMENTS_UPDATE)
  remove(@Param('tournamentId') tournamentId: string, @Param('id') id: string) {
    return this.raceDaysService.remove(tournamentId, id);
  }
}
