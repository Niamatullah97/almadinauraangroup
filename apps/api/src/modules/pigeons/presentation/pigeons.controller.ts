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
import { JwtPayload, Permission } from '@kabootar/shared';

import { Permissions } from '../../../common/decorators/auth.decorators';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PigeonsService } from '../application/pigeons.service';
import { CreatePigeonDto } from './dto/create-pigeon.dto';
import { UpdatePigeonDto } from './dto/update-pigeon.dto';

@ApiTags('Pigeons')
@ApiBearerAuth()
@Controller('pigeons')
export class PigeonsController {
  constructor(private readonly pigeonsService: PigeonsService) {}

  @Post()
  @Permissions(Permission.PIGEONS_CREATE)
  create(@GetUser() user: JwtPayload, @Body() dto: CreatePigeonDto) {
    return this.pigeonsService.create(user.sub, dto);
  }

  @Get()
  @Permissions(Permission.PIGEONS_READ)
  findAll(@Query() query: PaginationQueryDto, @GetUser() user: JwtPayload) {
    return this.pigeonsService.findAll(query, user.sub);
  }

  @Get(':id')
  @Permissions(Permission.PIGEONS_READ)
  findOne(@Param('id') id: string) {
    return this.pigeonsService.findOne(id);
  }

  @Patch(':id')
  @Permissions(Permission.PIGEONS_UPDATE)
  update(
    @Param('id') id: string,
    @GetUser() user: JwtPayload,
    @Body() dto: UpdatePigeonDto,
  ) {
    return this.pigeonsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @Permissions(Permission.PIGEONS_DELETE)
  remove(@Param('id') id: string, @GetUser() user: JwtPayload) {
    return this.pigeonsService.remove(id, user.sub);
  }
}
