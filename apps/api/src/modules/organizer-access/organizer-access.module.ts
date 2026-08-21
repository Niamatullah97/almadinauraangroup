import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { TournamentsModule } from '../tournaments/tournaments.module';
import { OrganizerAccessService } from './application/organizer-access.service';
import { OrganizerAccessController } from './presentation/organizer-access.controller';
import { TournamentAccessLinksController } from './presentation/tournament-access-links.controller';

@Module({
  imports: [
    TournamentsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [TournamentAccessLinksController, OrganizerAccessController],
  providers: [OrganizerAccessService],
})
export class OrganizerAccessModule {}
