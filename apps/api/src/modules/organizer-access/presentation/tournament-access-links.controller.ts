import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtPayload, Permission, UserRole } from '@kabootar/shared';

import { GetUser } from '../../../common/decorators/get-user.decorator';
import { Permissions, Roles } from '../../../common/decorators/auth.decorators';
import { OrganizerAccessService } from '../application/organizer-access.service';
import { CreateAccessLinkDto } from './dto/create-access-link.dto';

@ApiTags('Tournament Access Links')
@ApiBearerAuth()
@Roles(UserRole.SUPER_ADMIN)
@Controller('tournaments/:tournamentId/access-links')
export class TournamentAccessLinksController {
  constructor(private readonly organizerAccessService: OrganizerAccessService) {}

  @Get()
  @Permissions(Permission.TOURNAMENTS_READ)
  @ApiOperation({ summary: 'List organizer access links for a tournament' })
  list(@Param('tournamentId') tournamentId: string) {
    return this.organizerAccessService.list(tournamentId);
  }

  @Post()
  @Permissions(Permission.TOURNAMENTS_UPDATE)
  @ApiOperation({ summary: 'Create an organizer access link and secret key' })
  create(
    @Param('tournamentId') tournamentId: string,
    @GetUser() user: JwtPayload,
    @Body() dto: CreateAccessLinkDto,
  ) {
    return this.organizerAccessService.create(tournamentId, user.sub, dto);
  }

  @Delete(':linkId')
  @Permissions(Permission.TOURNAMENTS_UPDATE)
  @ApiOperation({ summary: 'Revoke an organizer access link' })
  revoke(
    @Param('tournamentId') tournamentId: string,
    @Param('linkId') linkId: string,
  ) {
    return this.organizerAccessService.revoke(tournamentId, linkId);
  }
}
