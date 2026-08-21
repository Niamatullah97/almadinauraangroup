import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class ParticipantQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by tournament' })
  @IsOptional()
  @IsString()
  tournamentId?: string;
}
