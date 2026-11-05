import { BadRequestException } from '@nestjs/common';
import { assertPdfFile } from './pdf-file.validator';

const buffer = Buffer.from('%PDF-1.7 content');

describe('assertPdfFile', () => {
  it('accepts a PDF', () => {
    expect(() => assertPdfFile({ mimetype: 'application/pdf', buffer })).not.toThrow();
  });

  it.each([
    ['a missing file', undefined],
    ['a wrong MIME type', { mimetype: 'text/plain', buffer }],
    ['a file renamed to PDF', { mimetype: 'application/pdf', buffer: Buffer.from('PK zip file') }],
    ['an empty file', { mimetype: 'application/pdf', buffer: Buffer.alloc(0) }],
  ])('rejects %s', (_name, file) => {
    expect(() => assertPdfFile(file)).toThrow(BadRequestException);
  });
});
