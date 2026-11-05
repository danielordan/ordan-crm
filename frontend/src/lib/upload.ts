import type { AlertVariant } from '@/components/ui/Alert';
import { SessionExpiredError } from './clients-api';

// Same limit as the backend's MAX_UPLOAD_BYTES (PRD 4.3)
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export interface UploadOutcome {
  variant: AlertVariant;
  message: string;
  canRetry?: boolean;
  // What is wrong, shown under the message
  details?: string;
  // A record was saved and can be fixed right away
  clientId?: string;
}

// Result messages (PRD 4.3, DESIGN 1.2)
const ADDED: UploadOutcome = { variant: 'success', message: 'Client added successfully.' };
const DUPLICATE: UploadOutcome = {
  variant: 'info',
  message: 'Client already exists. No changes were made.',
};
const PARTIAL_MESSAGE = 'Information was extracted, but some required fields are missing.';
const EXTRACTION_FAILED: UploadOutcome = {
  variant: 'error',
  message: 'Could not extract information from the file. Please try again.',
  canRetry: true,
};
const NOT_PDF: UploadOutcome = { variant: 'error', message: 'Only PDF files are supported.' };
const TOO_LARGE: UploadOutcome = {
  variant: 'error',
  message: 'File is too large. Maximum size is 4 MB.',
};
const TECHNICAL_FAILURE: UploadOutcome = {
  variant: 'error',
  message: 'Something went wrong. Please try again.',
  canRetry: true,
};

// A convenience check only; the backend validates the file on its own (ARCHITECTURE 5.4)
export function validatePdfFile(file: File): UploadOutcome | null {
  if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) return NOT_PDF;
  if (file.size > MAX_UPLOAD_BYTES) return TOO_LARGE;
  return null;
}

// Response of POST /api/documents/process (ARCHITECTURE 12.2)
function outcomeFromResult(body: unknown): UploadOutcome {
  const { result, processingStatus, clientId, errorDetails } = (body ?? {}) as {
    result?: unknown;
    processingStatus?: unknown;
    clientId?: string;
    errorDetails?: string | null;
  };
  if (result === 'duplicate') return DUPLICATE;
  if (result === 'extraction_failed') return EXTRACTION_FAILED;
  if (result === 'created' && processingStatus === 'Success') return ADDED;
  if (result === 'created' && processingStatus === 'Failed') {
    return {
      variant: 'warning',
      message: PARTIAL_MESSAGE,
      details: errorDetails ?? undefined,
      clientId,
    };
  }
  return TECHNICAL_FAILURE;
}

// Never rejects for a failed upload; only an expired session throws, which the screen handles
export async function uploadDocument(file: File): Promise<UploadOutcome> {
  const form = new FormData();
  form.append('file', file);

  let response: Response;
  try {
    response = await fetch('/api/documents/process', { method: 'POST', body: form });
  } catch {
    return TECHNICAL_FAILURE;
  }

  if (response.status === 401) throw new SessionExpiredError();
  if (response.status === 400) return NOT_PDF;
  if (response.status === 413) return TOO_LARGE;
  if (!response.ok) return TECHNICAL_FAILURE;

  try {
    return outcomeFromResult(await response.json());
  } catch {
    return TECHNICAL_FAILURE;
  }
}
