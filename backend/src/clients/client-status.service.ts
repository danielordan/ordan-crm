import { Injectable } from '@nestjs/common';
import type { ClientFields, ClientStatus } from './client.types';

// Required for Success, with their display names (ARCHITECTURE 9.1)
const REQUIRED: [keyof ClientFields, string][] = [
  ['companyName', 'Company Name'],
  ['email', 'Email'],
  ['originPort', 'Origin Port'],
  ['originCountry', 'Origin Country'],
  ['destinationPort', 'Destination Port'],
  ['incoterms', 'Incoterms'],
  ['shipmentType', 'Shipment Type'],
];

@Injectable()
export class ClientStatusService {
  compute(fields: ClientFields): ClientStatus {
    const missing = REQUIRED.filter(([field]) => !fields[field]?.trim()).map(([, label]) => label);
    return missing.length
      ? {
          processingStatus: 'Failed',
          errorDetails: `Missing required fields: ${missing.join(', ')}.`,
        }
      : { processingStatus: 'Success', errorDetails: null };
  }
}
