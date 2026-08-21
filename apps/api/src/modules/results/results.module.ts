import { Module } from '@nestjs/common';

import { ResultsService } from './application/results.service';
import { ResultsController } from './presentation/results.controller';

@Module({
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
