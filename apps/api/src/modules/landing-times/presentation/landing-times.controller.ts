import { Permission, UserRole } from '@kabootar/shared';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Permissions, Public, Roles } from '../../../common/decorators/auth.decorators';
import { LandingTimesService } from '../application/landing-times.service';

import { BulkSaveLandingTimesDto } from './dto/bulk-save-landing-times.dto';
import { CreateLandingTimeDto } from './dto/create-landing-time.dto';
import { UpdateLandingTimeDto } from './dto/update-landing-time.dto';

@ApiTags('Landing Times')
@Controller('tournaments/:tournamentId/race-days/:raceDayId/landing-times')
export class LandingTimesController {
  constructor(private readonly landingTimesService: LandingTimesService) {}

  @Public()
  @Get('entry-sheet')
  getEntrySheet(
    @Param('tournamentId') tournamentId: string,
    @Param('raceDayId') raceDayId: string,
    @Query('participantId') participantId?: string,
  ) {
    return this.landingTimesService.getEntrySheet(tournamentId, raceDayId, participantId);
  }

  @Public()
  @Get()
  findAll(
    @Param('tournamentId') tournamentId: string,
    @Param('raceDayId') raceDayId: string,
    @Query('participantId') participantId?: string,
  ) {
    return this.landingTimesService.findAll(tournamentId, raceDayId, participantId);
  }

  @Post()
  @ApiBearerAuth()
  @Permissions(Permission.ENTRIES_CREATE)
  create(
    @Param('tournamentId') tournamentId: string,
    @Param('raceDayId') raceDayId: string,
    @Body() dto: CreateLandingTimeDto,
  ) {
    return this.landingTimesService.create(tournamentId, raceDayId, dto);
  }

  @Post('bulk')
  @ApiBearerAuth()
  @Permissions(Permission.ENTRIES_CREATE, Permission.ENTRIES_UPDATE)
  bulkSave(
    @Param('tournamentId') tournamentId: string,
    @Param('raceDayId') raceDayId: string,
    @Body() dto: BulkSaveLandingTimesDto,
  ) {
    return this.landingTimesService.bulkSave(tournamentId, raceDayId, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Permissions(Permission.ENTRIES_UPDATE)
  update(
    @Param('tournamentId') tournamentId: string,
    @Param('raceDayId') raceDayId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLandingTimeDto,
  ) {
    return this.landingTimesService.update(tournamentId, raceDayId, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @Permissions(Permission.ENTRIES_UPDATE)
  remove(
    @Param('tournamentId') tournamentId: string,
    @Param('raceDayId') raceDayId: string,
    @Param('id') id: string,
  ) {
    return this.landingTimesService.remove(tournamentId, raceDayId, id);
  }
}
