import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtPayload, Permission } from '@kabootar/shared';
import { memoryStorage } from 'multer';

import { GetUser } from '../../../common/decorators/get-user.decorator';
import { Permissions, Public } from '../../../common/decorators/auth.decorators';
import { TournamentsService } from '../application/tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { TournamentQueryDto } from './dto/tournament-query.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';

@ApiTags('Tournaments')
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Public()
  @Get()
  findAll(@Query() query: TournamentQueryDto) {
    return this.tournamentsService.findAll(query);
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.tournamentsService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tournamentsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @Permissions(Permission.TOURNAMENTS_CREATE)
  create(@GetUser() user: JwtPayload, @Body() dto: CreateTournamentDto) {
    return this.tournamentsService.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Permissions(Permission.TOURNAMENTS_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateTournamentDto) {
    return this.tournamentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Permissions(Permission.TOURNAMENTS_DELETE)
  remove(@Param('id') id: string) {
    return this.tournamentsService.remove(id);
  }

  @Post(':id/banner')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @Permissions(Permission.TOURNAMENTS_UPDATE)
  @UseInterceptors(
    FileInterceptor('banner', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadBanner(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.tournamentsService.uploadBanner(id, file);
  }
}
