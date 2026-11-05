import { Injectable } from '@nestjs/common';
import type { ClientFields } from '../clients/client.types';
import type { ExtractedData } from './extraction.schema';

// eslint-disable-next-line no-control-regex -- removing control characters is the point
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g;
const TO_ORDER = /^to\s+(the\s+)?order\b/i;

// PostgreSQL text cannot hold NUL, and line breaks from the document are not meaningful
function cleanText(value: string | null): string | null {
  const cleaned = (value ?? '').replace(CONTROL_CHARACTERS, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || null;
}

// Cleans the AI output (ARCHITECTURE 8.5). No format validation: what the document says is kept
// (ADR-27), and nothing missing is ever filled in.
@Injectable()
export class ExtractionNormalizerService {
  normalize(data: ExtractedData): ClientFields {
    const companyName = cleanText(data.companyName);
    return {
      // Server-side safety net for the prompt rule on "TO ORDER" consignees
      companyName: companyName && TO_ORDER.test(companyName) ? null : companyName,
      address: cleanText(data.address),
      phone: cleanText(data.phone),
      email: cleanText(data.email),
      originPort: cleanText(data.originPort),
      originCountry: cleanText(data.originCountry),
      destinationPort: cleanText(data.destinationPort),
      incoterms: cleanText(data.incoterms),
      shipmentType: data.shipmentType,
    };
  }
}
