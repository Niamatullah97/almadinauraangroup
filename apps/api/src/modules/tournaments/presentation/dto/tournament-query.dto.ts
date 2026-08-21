import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TournamentStatus } from '@prisma/client';

import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class TournamentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TournamentStatus })
  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;
}
