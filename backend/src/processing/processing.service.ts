import { Injectable, Logger } from '@nestjs/common';
import { toClientWrite } from '../clients/client.mapper';
import { ClientStatusService } from '../clients/client-status.service';
import type { ClientFields } from '../clients/client.types';
import { ClientsRepository, isUniqueViolation } from '../clients/clients.repository';
import { DuplicateDetectionService } from '../clients/duplicate-detection.service';
import { ShipmentDataExtractor } from '../extraction/ai-extraction.service';
import { ExtractionNormalizerService } from '../extraction/extraction-normalizer.service';
import { ExtractionError } from '../extraction/extraction.errors';
import { DocumentTextExtractor } from '../extraction/pdf-text.service';

// Response of POST /documents/process (ARCHITECTURE 12.2)
export type ProcessingResult =
  | { result: 'created'; processingStatus: 'Success'; clientId: string }
  | { result: 'created'; processingStatus: 'Failed'; clientId: string; errorDetails: string | null }
  | { result: 'duplicate' }
  | { result: 'extraction_failed' };

type Outcome =
  | 'AUTO_SUCCESS'
  | 'DUPLICATE_SKIPPED'
  | 'MANUAL_REVIEW'
  | 'EXTRACTION_FAILED'
  | 'TECHNICAL_FAILURE';

// Coordinates the workflow (ARCHITECTURE 6.3). Logs carry categories and IDs only, never the
// document text or the extracted values (ARCHITECTURE 16.7).
@Injectable()
export class ProcessingService {
  private readonly logger = new Logger(ProcessingService.name);

  constructor(
    private readonly textExtractor: DocumentTextExtractor,
    private readonly dataExtractor: ShipmentDataExtractor,
    private readonly normalizer: ExtractionNormalizerService,
    private readonly duplicates: DuplicateDetectionService,
    private readonly status: ClientStatusService,
    private readonly clients: ClientsRepository,
  ) {}

  async process(pdf: Buffer): Promise<ProcessingResult> {
    this.logger.log({ event: 'document_received' });
    try {
      const extracted = await this.extract(pdf);
      if (extracted instanceof ExtractionError) {
        this.logger.warn({
          event: 'extraction_failed',
          reason: extracted.category,
          status: extracted.status,
        });
        this.logOutcome('EXTRACTION_FAILED');
        return { result: 'extraction_failed' };
      }
      return await this.save(extracted);
    } catch (error) {
      this.logOutcome('TECHNICAL_FAILURE');
      throw error;
    }
  }

  private async extract(pdf: Buffer): Promise<ClientFields | ExtractionError> {
    try {
      const text = await this.textExtractor.extract(pdf);
      this.logger.log({ event: 'pdf_text_extracted' });
      const data = await this.dataExtractor.extract(text);
      this.logger.log({ event: 'ai_extraction_completed' });
      const fields = this.normalizer.normalize(data);
      // Nothing was found, so there is nothing to save or to complete (ADR-31)
      if (Object.values(fields).every((value) => value === null)) {
        return new ExtractionError('NO_DATA_EXTRACTED');
      }
      return fields;
    } catch (error) {
      if (error instanceof ExtractionError) return error;
      throw error;
    }
  }

  private async save(fields: ClientFields): Promise<ProcessingResult> {
    if (await this.duplicates.findDuplicate(fields)) return this.duplicate();

    const clientStatus = this.status.compute(fields);
    let clientId: string;
    try {
      clientId = await this.clients.create(toClientWrite(fields, clientStatus));
    } catch (error) {
      // Two simultaneous uploads can both pass the check above; the unique index decides (11.5)
      if (isUniqueViolation(error)) return this.duplicate();
      throw error;
    }

    this.logger.log({ event: 'client_created', clientId });
    if (clientStatus.processingStatus === 'Success') {
      this.logOutcome('AUTO_SUCCESS');
      return { result: 'created', processingStatus: 'Success', clientId };
    }
    this.logOutcome('MANUAL_REVIEW');
    return {
      result: 'created',
      processingStatus: 'Failed',
      clientId,
      errorDetails: clientStatus.errorDetails,
    };
  }

  private duplicate(): ProcessingResult {
    this.logger.log({ event: 'duplicate_detected' });
    this.logOutcome('DUPLICATE_SKIPPED');
    return { result: 'duplicate' };
  }

  private logOutcome(outcome: Outcome): void {
    this.logger.log({ event: 'processing_outcome', outcome });
  }
}
