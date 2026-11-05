import { normalizeCompanyName, normalizeEmail, phoneToDigits } from '../common/text/normalize';
import type {
  Client,
  ClientFields,
  ClientListItem,
  ClientListRow,
  ClientRow,
  ClientStatus,
  ClientWrite,
} from './client.types';

export function toClientListItem(row: ClientListRow): ClientListItem {
  return {
    id: row.id,
    companyName: row.company_name,
    email: row.email,
    phone: row.phone,
    dateAdded: row.date_added.toISOString(),
    processingStatus: row.processing_status,
  };
}

export function toClientFields(row: ClientRow): ClientFields {
  return {
    companyName: row.company_name,
    address: row.address,
    phone: row.phone,
    email: row.email,
    originPort: row.origin_port,
    originCountry: row.origin_country,
    destinationPort: row.destination_port,
    incoterms: row.incoterms,
    shipmentType: row.shipment_type,
  };
}

// Adds the columns derived from the fields (ARCHITECTURE 9.4)
export function toClientWrite(fields: ClientFields, status: ClientStatus): ClientWrite {
  return {
    ...fields,
    ...status,
    companyNameNormalized: normalizeCompanyName(fields.companyName),
    emailNormalized: normalizeEmail(fields.email),
    phoneDigits: phoneToDigits(fields.phone),
  };
}

export function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    ...toClientFields(row),
    dateAdded: row.date_added.toISOString(),
    processingStatus: row.processing_status,
    errorDetails: row.error_details,
  };
}
