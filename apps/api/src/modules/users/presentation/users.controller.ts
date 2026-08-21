import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@kabootar/shared';

import { Permissions } from '../../../common/decorators/auth.decorators';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { UsersService } from '../application/users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions(Permission.USERS_READ)
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Permissions(Permission.USERS_READ)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
