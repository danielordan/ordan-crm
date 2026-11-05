import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { ExtractionModule } from '../extraction/extraction.module';
import { ProcessingService } from './processing.service';

@Module({
  imports: [ClientsModule, ExtractionModule],
  providers: [ProcessingService],
  exports: [ProcessingService],
})
export class ProcessingModule {}
