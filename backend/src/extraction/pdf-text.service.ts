import { Injectable } from '@nestjs/common';
import { ExtractionError } from './extraction.errors';

// Below this many non-space characters the PDF is treated as having no usable text, e.g. a scan
const MIN_TEXT_CHARS = 20;
// Text within this many points vertically is one line
const SAME_LINE_POINTS = 3;
const POINTS_PER_CHARACTER = 4;

export abstract class DocumentTextExtractor {
  // Throws ExtractionError('PDF_PARSE_ERROR') when no usable text can be read
  abstract extract(pdf: Buffer): Promise<string>;
}

@Injectable()
export class PdfJsTextExtractor extends DocumentTextExtractor {
  async extract(pdf: Buffer): Promise<string> {
    let text: string;
    try {
      text = await readText(pdf);
    } catch {
      // Corrupt or password-protected file. PDF.js messages are not useful to the user.
      throw new ExtractionError('PDF_PARSE_ERROR');
    }
    if (text.replace(/\s/g, '').length < MIN_TEXT_CHARS) {
      throw new ExtractionError('PDF_PARSE_ERROR');
    }
    return text;
  }
}

interface TextPiece {
  str: string;
  transform: number[];
  width: number;
}

// Rebuilds the page as it looks, with each piece indented according to its position. A PDF stores
// text in any order, so reading it as stored can separate a label such as "Consignee" from its
// value, and the indentation keeps side-by-side columns apart.
function layoutText(items: TextPiece[]): string {
  const pieces = items
    .filter((item) => item.str.trim())
    .map((item) => ({ ...item, x: item.transform[4], y: item.transform[5] }))
    .sort((a, b) => b.y - a.y);
  const left = Math.min(...pieces.map((piece) => piece.x));

  const lines: (typeof pieces)[] = [];
  for (const piece of pieces) {
    const line = lines.at(-1);
    if (line && line[0].y - piece.y <= SAME_LINE_POINTS) line.push(piece);
    else lines.push([piece]);
  }

  return lines
    .map((line) => {
      let text = '';
      let end = 0;
      for (const piece of line.sort((a, b) => a.x - b.x)) {
        const column = Math.round((piece.x - left) / POINTS_PER_CHARACTER);
        if (column > text.length) text = text.padEnd(column);
        else if (text && piece.x - end > 1) text += ' ';
        text += piece.str;
        end = piece.x + piece.width;
      }
      return text.trimEnd();
    })
    .join('\n');
}

async function readText(pdf: Buffer): Promise<string> {
  // pdfjs-dist is ESM-only and the backend is CommonJS, so it has to be a dynamic import
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = getDocument({
    // PDF.js rejects Buffer; this also copies the bytes, leaving the caller's buffer untouched
    data: new Uint8Array(pdf),
    verbosity: 0,
  });
  try {
    const document = await task.promise;
    const pages: string[] = [];
    for (let number = 1; number <= document.numPages; number += 1) {
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      pages.push(layoutText(content.items.filter((item) => 'str' in item)));
    }
    return pages.join('\n');
  } finally {
    await task.destroy();
  }
}
