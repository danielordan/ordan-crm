import { ExtractionError } from './extraction.errors';
import { PdfJsTextExtractor } from './pdf-text.service';

// Builds a small valid one-page PDF; synthetic, so no real customer data lives in the repository
function makePdf(text: string | null | [number, number, string][]): Buffer {
  const pieces = typeof text === 'string' ? ([[72, 720, text]] as const) : (text ?? []);
  const stream = pieces.map(([x, y, str]) => `BT /F1 12 Tf ${x} ${y} Td (${str}) Tj ET`).join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((body, index) => {
    const offset = pdf.length;
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  const entries = offsets
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  pdf += `xref\n0 6\n0000000000 65535 f \n${entries}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

describe('PdfJsTextExtractor', () => {
  const extractor = new PdfJsTextExtractor();

  it('reads the text of a digital PDF', async () => {
    const text = await extractor.extract(makePdf('CONSIGNEE Acme Trading Ltd info@acme.com'));
    expect(text).toContain('Acme Trading Ltd');
    expect(text).toContain('info@acme.com');
  });

  it('keeps a label next to its value, whatever order the file stores them in', async () => {
    const pdf = makePdf([
      [72, 660, 'Avcom LTD'],
      [72, 720, 'Shipper'],
      [72, 700, 'Sony Europe'],
      [72, 680, 'Consignee'],
      [300, 680, 'CARRIER: Scan Global'],
    ]);
    const lines = (await extractor.extract(pdf)).split('\n');
    expect(lines).toEqual([
      'Shipper',
      'Sony Europe',
      expect.stringMatching(/^Consignee {40,}CARRIER: Scan Global$/),
      'Avcom LTD',
    ]);
  });

  it('leaves the original bytes untouched', async () => {
    const pdf = makePdf('CONSIGNEE Acme Trading Ltd info@acme.com');
    const copy = Buffer.from(pdf);
    await extractor.extract(pdf);
    expect(pdf.equals(copy)).toBe(true);
  });

  it.each([
    ['has no text', makePdf(null)],
    ['has almost no text', makePdf('abc')],
    ['is corrupt', Buffer.from('%PDF-1.4 this is not really a pdf')],
  ])('fails with PDF_PARSE_ERROR when the file %s', async (_name, pdf) => {
    await expect(extractor.extract(pdf)).rejects.toEqual(new ExtractionError('PDF_PARSE_ERROR'));
  });
});
