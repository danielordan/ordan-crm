export type ProcessingStatus = 'Success' | 'Failed';

// Columns returned by the list query (ARCHITECTURE 11.2)
export interface ClientListRow {
  id: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  date_added: Date;
  processing_status: ProcessingStatus;
}

export interface ClientListItem {
  id: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  dateAdded: string;
  processingStatus: ProcessingStatus;
}

export interface ClientListResponse {
  items: ClientListItem[];
  page: number;
  limit: number;
  hasNextPage: boolean;
}
