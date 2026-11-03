import type { ClientListItem, ClientListRow } from './client.types';

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
