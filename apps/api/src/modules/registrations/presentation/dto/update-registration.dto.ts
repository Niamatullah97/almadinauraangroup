import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ParticipantDetailsDto } from '../../../participants/presentation/dto/participant-details.dto';

export class UpdateRegistrationDto {
  @ApiPropertyOptional({ type: ParticipantDetailsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ParticipantDetailsDto)
  participant?: ParticipantDetailsDto;
}
