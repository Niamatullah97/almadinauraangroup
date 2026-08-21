import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@kabootar/shared';

import { Permissions, Public } from '../../../common/decorators/auth.decorators';
import { RegistrationsService } from '../application/registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { RegistrationQueryDto } from './dto/registration-query.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';

@ApiTags('Registrations')
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Public()
  @Get()
  findAll(@Query() query: RegistrationQueryDto) {
    return this.registrationsService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registrationsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @Permissions(Permission.ENTRIES_CREATE)
  create(@Body() dto: CreateRegistrationDto) {
    return this.registrationsService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Permissions(Permission.ENTRIES_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateRegistrationDto) {
    return this.registrationsService.update(id, dto);
  }

  @Post(':id/payments')
  @ApiBearerAuth()
  @Permissions(Permission.ENTRIES_UPDATE)
  recordPayment(@Param('id') id: string, @Body() dto: RecordPaymentDto) {
    return this.registrationsService.recordPayment(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Permissions(Permission.ENTRIES_UPDATE)
  remove(@Param('id') id: string) {
    return this.registrationsService.remove(id);
  }
}
