import { Module } from '@nestjs/common';
import { PigeonsController } from './presentation/pigeons.controller';
import { PigeonsService } from './application/pigeons.service';

@Module({
  controllers: [PigeonsController],
  providers: [PigeonsService],
  exports: [PigeonsService],
})
export class PigeonsModule {}
