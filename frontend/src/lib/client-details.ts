import type { ProcessingStatus } from '@/components/ui/StatusBadge';

export type ShipmentType = 'FCL' | 'LCL';

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

export interface Client extends ClientFields {
  id: string;
  dateAdded: string;
  processingStatus: ProcessingStatus;
  errorDetails: string | null;
}

export type ClientField = keyof ClientFields;

// Form values: an input holds text, so a missing value is an empty string
export type ClientFormValues = Record<ClientField, string>;

export interface FieldDefinition {
  name: ClientField;
  label: string;
}

// Display order (PRD 4.6)
export const CONSIGNEE_FIELDS: FieldDefinition[] = [
  { name: 'companyName', label: 'Company Name' },
  { name: 'address', label: 'Address' },
  { name: 'phone', label: 'Phone' },
  { name: 'email', label: 'Email' },
];

export const SHIPMENT_FIELDS: FieldDefinition[] = [
  { name: 'originPort', label: 'Origin Port' },
  { name: 'originCountry', label: 'Origin Country' },
  { name: 'destinationPort', label: 'Destination Port' },
  { name: 'incoterms', label: 'Incoterms' },
  { name: 'shipmentType', label: 'Shipment Type' },
];

export function toFormValues(client: Client): ClientFormValues {
  const values = {} as ClientFormValues;
  for (const { name } of [...CONSIGNEE_FIELDS, ...SHIPMENT_FIELDS]) {
    values[name] = client[name] ?? '';
  }
  return values;
}

// Body of PATCH /api/clients/:id. Text goes as entered; the backend turns blank text into null.
export function toUpdateBody(values: ClientFormValues): ClientFields {
  return { ...values, shipmentType: (values.shipmentType as ShipmentType) || null };
}
