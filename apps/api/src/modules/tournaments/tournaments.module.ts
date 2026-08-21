import { Module } from '@nestjs/common';

import { StorageModule } from '../../infrastructure/storage/storage.module';
import { TournamentsController } from './presentation/tournaments.controller';
import { TournamentsService } from './application/tournaments.service';

@Module({
  imports: [StorageModule],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
