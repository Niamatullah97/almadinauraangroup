import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@kabootar/shared';

import { Permissions } from '../../../common/decorators/auth.decorators';
import { DashboardService } from '../application/dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Permissions(Permission.TOURNAMENTS_READ)
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  getStats() {
    return this.dashboardService.getStats();
  }
}
