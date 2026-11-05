import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { Env } from '../common/config/env.schema';
import {
  OPENAI_CLIENT,
  OpenAIShipmentDataExtractor,
  ShipmentDataExtractor,
} from './ai-extraction.service';
import { ExtractionNormalizerService } from './extraction-normalizer.service';
import { DocumentTextExtractor, PdfJsTextExtractor } from './pdf-text.service';

@Module({
  providers: [
    ExtractionNormalizerService,
    { provide: DocumentTextExtractor, useClass: PdfJsTextExtractor },
    { provide: ShipmentDataExtractor, useClass: OpenAIShipmentDataExtractor },
    {
      provide: OPENAI_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        new OpenAI({ apiKey: config.get('OPENAI_API_KEY', { infer: true }) }),
    },
  ],
  exports: [DocumentTextExtractor, ShipmentDataExtractor, ExtractionNormalizerService],
})
export class ExtractionModule {}
