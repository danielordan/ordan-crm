import { BadRequestException } from '@nestjs/common';

export interface UploadedPdf {
  mimetype: string;
  buffer: Buffer;
}

const PDF_SIGNATURE = Buffer.from('%PDF-');

// Independent of the browser's check (ARCHITECTURE 16.4). The size limit is enforced by Multer.
export function assertPdfFile(file: UploadedPdf | undefined): asserts file is UploadedPdf {
  if (!file) throw new BadRequestException('A PDF file is required.');
  const hasSignature = file.buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE);
  if (file.mimetype !== 'application/pdf' || !hasSignature) {
    throw new BadRequestException('Only PDF files are supported.');
  }
}
