import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { ParticipantDetailsDto } from './participant-details.dto';

export class CreateParticipantDto extends ParticipantDetailsDto {
  @ApiProperty()
  @IsUUID()
  tournamentId!: string;
}
