export type ProcessingStatus = 'Success' | 'Failed';
export type ShipmentType = 'FCL' | 'LCL';

// The nine fields extracted from a document and editable by the user (PRD 4.4, 4.6)
export interface ClientFields {
  companyName: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  originPort: string | null;
  originCountry: string | null;
  destinationPort: string | null;
  incoterms: string | null;
  shipmentType: ShipmentType | null;
}

export interface ClientStatus {
  processingStatus: ProcessingStatus;
  errorDetails: string | null;
}

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

// A full row of the clients table (ARCHITECTURE 11.2)
export interface ClientRow extends ClientListRow {
  company_name_normalized: string | null;
  address: string | null;
  email_normalized: string | null;
  origin_port: string | null;
  origin_country: string | null;
  destination_port: string | null;
  incoterms: string | null;
  shipment_type: ShipmentType | null;
  error_details: string | null;
}

// A client as returned by the API; normalized columns stay internal
export interface Client extends ClientFields, ClientStatus {
  id: string;
  dateAdded: string;
}

// Values written by an edit, including everything derived from the edited fields
export interface ClientUpdate extends ClientFields, ClientStatus {
  companyNameNormalized: string | null;
  emailNormalized: string | null;
  phoneDigits: string | null;
}

// Normalized values compared by duplicate detection (ARCHITECTURE 9.4)
export interface DuplicateKeys {
  companyName: string | null;
  email: string | null;
}
