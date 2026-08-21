import { Module } from '@nestjs/common';

import { RegistrationsService } from './application/registrations.service';
import { RegistrationsController } from './presentation/registrations.controller';
import { TournamentRegistrationsController } from './presentation/tournament-registrations.controller';

@Module({
  controllers: [RegistrationsController, TournamentRegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
