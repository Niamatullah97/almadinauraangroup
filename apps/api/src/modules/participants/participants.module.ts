import { Module } from '@nestjs/common';

import { StorageModule } from '../../infrastructure/storage/storage.module';
import { ParticipantsController } from './presentation/participants.controller';
import { ParticipantsService } from './application/participants.service';

@Module({
  imports: [StorageModule],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
