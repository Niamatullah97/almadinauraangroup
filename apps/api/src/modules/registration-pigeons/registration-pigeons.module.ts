import { Module } from '@nestjs/common';

import { RegistrationPigeonsService } from './application/registration-pigeons.service';
import { RegistrationPigeonsController } from './presentation/registration-pigeons.controller';

@Module({
  controllers: [RegistrationPigeonsController],
  providers: [RegistrationPigeonsService],
  exports: [RegistrationPigeonsService],
})
export class RegistrationPigeonsModule {}
