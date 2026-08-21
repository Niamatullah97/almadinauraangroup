import { Module } from '@nestjs/common';

import { ResultsModule } from '../results/results.module';
import { RegistrationPigeonsModule } from '../registration-pigeons/registration-pigeons.module';
import { LandingTimesService } from './application/landing-times.service';
import { LandingTimesController } from './presentation/landing-times.controller';

@Module({
  imports: [ResultsModule, RegistrationPigeonsModule],
  controllers: [LandingTimesController],
  providers: [LandingTimesService],
  exports: [LandingTimesService],
})
export class LandingTimesModule {}
