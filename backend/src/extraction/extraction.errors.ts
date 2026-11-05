// Why extraction failed (ARCHITECTURE 17.1). Safe to log: never contains document content.
export type ExtractionFailure =
  'PDF_PARSE_ERROR' | 'AI_API_ERROR' | 'AI_TIMEOUT' | 'AI_SCHEMA_ERROR' | 'NO_DATA_EXTRACTED';

export class ExtractionError extends Error {
  // `status` is the provider's HTTP status, when there is one; useful in logs for finding the cause
  constructor(
    readonly category: ExtractionFailure,
    readonly status?: number,
  ) {
    super(category);
    this.name = 'ExtractionError';
  }
}
