import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import type { Env } from '../common/config/env.schema';
import { ProcessingModule } from '../processing/processing.module';
import { DocumentsController } from './documents.controller';

@Module({
  imports: [
    ProcessingModule,
    // No `dest` or `storage`: the file stays in memory and is never written to disk (ARCHITECTURE 7.2)
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        limits: { fileSize: config.get('MAX_UPLOAD_BYTES', { infer: true }), files: 1 },
      }),
    }),
  ],
  controllers: [DocumentsController],
})
export class DocumentsModule {}
