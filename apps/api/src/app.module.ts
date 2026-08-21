import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { HttpLoggingMiddleware } from './common/middleware/http-logging.middleware';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { LandingTimesModule } from './modules/landing-times/landing-times.module';
import { ParticipantsModule } from './modules/participants/participants.module';
import { PigeonsModule } from './modules/pigeons/pigeons.module';
import { RaceDaysModule } from './modules/race-days/race-days.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { RegistrationPigeonsModule } from './modules/registration-pigeons/registration-pigeons.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ResultsModule } from './modules/results/results.module';
import { OrganizerAccessModule } from './modules/organizer-access/organizer-access.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL_MS', 60000),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    DashboardModule,
    UsersModule,
    ParticipantsModule,
    PigeonsModule,
    TournamentsModule,
    OrganizerAccessModule,
    RaceDaysModule,
    RegistrationsModule,
    RegistrationPigeonsModule,
    LandingTimesModule,
    ResultsModule,
    ReportsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware, HttpLoggingMiddleware).forRoutes('*');
  }
}
