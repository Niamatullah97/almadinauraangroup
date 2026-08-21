import { IsObject, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ParticipantDetailsDto } from '../../../participants/presentation/dto/participant-details.dto';

export class CreateRegistrationDto {
  @ApiProperty()
  @IsUUID()
  tournamentId!: string;

  @ApiProperty({ type: ParticipantDetailsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => ParticipantDetailsDto)
  participant!: ParticipantDetailsDto;
}
