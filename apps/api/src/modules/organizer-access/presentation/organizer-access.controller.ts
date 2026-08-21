import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../../common/decorators/auth.decorators';
import { OrganizerAccessService } from '../application/organizer-access.service';
import { UnlockOrganizerDto } from './dto/unlock-organizer.dto';

@ApiTags('Organizer Access')
@Controller('organizer')
export class OrganizerAccessController {
  constructor(private readonly organizerAccessService: OrganizerAccessService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlock a tournament organizer access link with a secret key' })
  unlock(@Body() dto: UnlockOrganizerDto) {
    return this.organizerAccessService.unlock(dto.token, dto.secretKey);
  }
}
