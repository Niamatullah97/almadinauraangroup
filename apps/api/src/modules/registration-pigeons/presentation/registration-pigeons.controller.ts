import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@kabootar/shared';

import { Permissions, Public } from '../../../common/decorators/auth.decorators';
import { RegistrationPigeonsService } from '../application/registration-pigeons.service';
import { BulkGeneratePigeonsDto } from './dto/bulk-generate-pigeons.dto';
import { CreateRegistrationPigeonDto } from './dto/create-registration-pigeon.dto';
import { UpdateRegistrationPigeonDto } from './dto/update-registration-pigeon.dto';

@ApiTags('Registration Pigeons')
@Controller('registrations/:registrationId/pigeons')
export class RegistrationPigeonsController {
  constructor(private readonly registrationPigeonsService: RegistrationPigeonsService) {}

  @Public()
  @Get()
  findAll(@Param('registrationId') registrationId: string) {
    return this.registrationPigeonsService.findAllByRegistration(registrationId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('registrationId') registrationId: string, @Param('id') id: string) {
    return this.registrationPigeonsService.findOne(registrationId, id);
  }

  @Post()
  @ApiBearerAuth()
  @Permissions(Permission.PIGEONS_CREATE)
  create(
    @Param('registrationId') registrationId: string,
    @Body() dto: CreateRegistrationPigeonDto,
  ) {
    return this.registrationPigeonsService.create(registrationId, dto);
  }

  @Post('bulk-generate')
  @ApiBearerAuth()
  @Permissions(Permission.PIGEONS_CREATE)
  bulkGenerate(
    @Param('registrationId') registrationId: string,
    @Body() dto: BulkGeneratePigeonsDto,
  ) {
    return this.registrationPigeonsService.bulkGenerate(registrationId, dto);
  }

  @Patch(':id/double-stamp')
  @ApiBearerAuth()
  @Permissions(Permission.PIGEONS_UPDATE)
  toggleDoubleStamp(@Param('registrationId') registrationId: string, @Param('id') id: string) {
    return this.registrationPigeonsService.toggleDoubleStamp(registrationId, id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Permissions(Permission.PIGEONS_UPDATE)
  update(
    @Param('registrationId') registrationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRegistrationPigeonDto,
  ) {
    return this.registrationPigeonsService.update(registrationId, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Permissions(Permission.PIGEONS_DELETE)
  remove(@Param('registrationId') registrationId: string, @Param('id') id: string) {
    return this.registrationPigeonsService.remove(registrationId, id);
  }
}
