import {
  Body,
  Controller,
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
import { Permission } from '@kabootar/shared';
import { memoryStorage } from 'multer';

import { Permissions, Public } from '../../../common/decorators/auth.decorators';
import { ParticipantsService } from '../application/participants.service';
import { ParticipantQueryDto } from './dto/participant-query.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';

@ApiTags('Participants')
@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Public()
  @Get()
  findAll(@Query() query: ParticipantQueryDto) {
    return this.participantsService.findAll(query);
  }

  @Public()
  @Get('cities')
  listCities() {
    return this.participantsService.listCities();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.participantsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Permissions(Permission.PARTICIPANTS_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateParticipantDto) {
    return this.participantsService.update(id, dto);
  }

  @Post(':id/profile')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @Permissions(Permission.PARTICIPANTS_UPDATE)
  @UseInterceptors(
    FileInterceptor('profile', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadProfile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.participantsService.uploadProfileImage(id, file);
  }
}
