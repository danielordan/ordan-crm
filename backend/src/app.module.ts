import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ClientsModule } from './clients/clients.module';
import { AppConfigModule } from './common/config/app-config.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ApiKeyGuard } from './common/guards/api-key.guard';
import { LoggingModule } from './common/logging/logging.module';
import { HealthController } from './common/system/health.controller';
import { DatabaseModule } from './database/database.module';
import { DocumentsModule } from './documents/documents.module';
import { ExtractionModule } from './extraction/extraction.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProcessingModule } from './processing/processing.module';
import { UsersModule } from './users/users.module';

export const RATE_LIMIT = { ttl: 60_000, limit: 300 };

@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    ThrottlerModule.forRoot([RATE_LIMIT]),
    DatabaseModule,
    UsersModule,
    ClientsModule,
    DocumentsModule,
    ProcessingModule,
    ExtractionModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Guards run in registration order: rate limit first, so API key guessing is throttled too
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
