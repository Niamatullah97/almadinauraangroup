import { PartialType } from '@nestjs/swagger';

import { CreateRaceDayDto } from './create-race-day.dto';

export class UpdateRaceDayDto extends PartialType(CreateRaceDayDto) {}
