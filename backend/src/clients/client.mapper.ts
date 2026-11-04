import type {
  Client,
  ClientFields,
  ClientListItem,
  ClientListRow,
  ClientRow,
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

export function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    ...toClientFields(row),
    dateAdded: row.date_added.toISOString(),
    processingStatus: row.processing_status,
    errorDetails: row.error_details,
  };
}
