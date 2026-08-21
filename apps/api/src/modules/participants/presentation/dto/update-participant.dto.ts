import { PartialType } from '@nestjs/swagger';

import { ParticipantDetailsDto } from './participant-details.dto';

export class UpdateParticipantDto extends PartialType(ParticipantDetailsDto) {}
