import { Module } from '@nestjs/common';

import { ResultsModule } from '../results/results.module';
import { RaceDaysController } from './presentation/race-days.controller';
import { RaceDaysService } from './application/race-days.service';

@Module({
  imports: [ResultsModule],
  controllers: [RaceDaysController],
  providers: [RaceDaysService],
  exports: [RaceDaysService],
})
export class RaceDaysModule {}
