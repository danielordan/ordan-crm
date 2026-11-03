import { normalizeCompanyName, normalizeEmail, phoneToDigits } from '../common/text/normalize';

// Test clients for the Development database only. Fixed IDs let the seed replace its own
// rows on every run without touching anything else.

interface SeedInput {
  companyName: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  originPort: string | null;
  originCountry: string | null;
  destinationPort: string | null;
  incoterms: string | null;
  shipmentType: 'FCL' | 'LCL' | null;
}

export interface SeedClient extends SeedInput {
  id: string;
  companyNameNormalized: string | null;
  emailNormalized: string | null;
  phoneDigits: string | null;
  dateAdded: Date;
  processingStatus: 'Success' | 'Failed';
  errorDetails: string | null;
}

// Required fields for Success (ARCHITECTURE 9.1), with their display names
const REQUIRED: [keyof SeedInput, string][] = [
  ['companyName', 'Company Name'],
  ['email', 'Email'],
  ['originPort', 'Origin Port'],
  ['originCountry', 'Origin Country'],
  ['destinationPort', 'Destination Port'],
  ['incoterms', 'Incoterms'],
  ['shipmentType', 'Shipment Type'],
];

const COMPANIES = [
  'Blue Ocean Imports Ltd',
  'Galil Trading Co',
  'Negev Home Supplies',
  'Carmel Electronics',
  'Tel Aviv Textiles',
  'Jordan Valley Foods',
  'Haifa Machinery Ltd',
  'Eilat Marine Parts',
  'Sharon Furniture',
  'Golan Wineries',
  'Herzliya Tech Imports',
  'Ashdod Building Materials',
  'Modiin Toys & Games',
  'Rishon Auto Parts',
  'Netanya Fashion House',
  'Petah Tikva Plastics',
  'Beer Sheva Agro',
  'Kfar Saba Kitchenware',
  'Rehovot Lab Supplies',
  'Holon Packaging',
];

const ORIGINS: [string, string][] = [
  ['Shanghai', 'China'],
  ['Ningbo', 'China'],
  ['Shenzhen', 'China'],
  ['Busan', 'South Korea'],
  ['Mundra', 'India'],
  ['Istanbul', 'Turkey'],
  ['Valencia', 'Spain'],
  ['Hamburg', 'Germany'],
];

const DESTINATIONS = ['Haifa', 'Ashdod', 'Eilat'];
const INCOTERMS = ['FOB', 'CIF', 'EXW', 'CFR', 'DAP'];
const PHONE_FORMATS = [
  (n: number) => `+972 3 555 ${String(1000 + n).slice(-4)}`,
  (n: number) => `03-555-${String(2000 + n).slice(-4)}`,
  (n: number) => `+972-52-${String(7000000 + n * 137).slice(-7)}`,
  (n: number) => `(212) 555-${String(100 + n).padStart(4, '0')}`,
];

// Every 5th row misses one or more required fields; some also miss optional ones
function buildInput(n: number): SeedInput {
  const company = COMPANIES[n % COMPANIES.length];
  const branch = Math.floor(n / COMPANIES.length);
  const companyName = branch === 0 ? company : `${company} ${['North', 'South'][branch - 1]}`;
  const slug = companyName.toLowerCase().replace(/[^a-z]+/g, '');
  const [originPort, originCountry] = ORIGINS[n % ORIGINS.length];

  const input: SeedInput = {
    companyName,
    address: `${10 + n} Harbour Road, ${DESTINATIONS[n % DESTINATIONS.length]}, Israel`,
    phone: PHONE_FORMATS[n % PHONE_FORMATS.length](n),
    email: `info@${slug}.co.il`,
    originPort,
    originCountry,
    destinationPort: DESTINATIONS[n % DESTINATIONS.length],
    incoterms: INCOTERMS[n % INCOTERMS.length],
    shipmentType: n % 3 === 0 ? 'LCL' : 'FCL',
  };

  if (n % 7 === 3) input.address = null;
  if (n % 6 === 2) input.phone = null;
  if (n % 5 === 4) {
    const missing: (keyof SeedInput)[][] = [
      ['email'],
      ['companyName'],
      ['incoterms', 'shipmentType'],
      ['originPort', 'originCountry', 'destinationPort'],
      ['email', 'incoterms'],
      ['companyName', 'email'],
    ];
    for (const field of missing[Math.floor(n / 5) % missing.length]) input[field] = null;
  }
  return input;
}

function seedId(n: number): string {
  return `00000000-0000-4000-8000-${String(n + 1).padStart(12, '0')}`;
}

export const SEED_COUNT = 60;
const FIRST_DATE = Date.UTC(2026, 4, 1, 6, 0); // May 1, 2026

export function buildSeedClients(): SeedClient[] {
  return Array.from({ length: SEED_COUNT }, (_, n) => {
    const input = buildInput(n);
    const missing = REQUIRED.filter(([field]) => input[field] === null).map(([, label]) => label);
    return {
      ...input,
      id: seedId(n),
      companyNameNormalized: normalizeCompanyName(input.companyName),
      emailNormalized: normalizeEmail(input.email),
      phoneDigits: phoneToDigits(input.phone),
      // Spread over about four months, at varying times of day
      dateAdded: new Date(FIRST_DATE + n * 2 * 86_400_000 + (n % 9) * 3_700_000),
      processingStatus: missing.length ? 'Failed' : 'Success',
      errorDetails: missing.length ? `Missing required fields: ${missing.join(', ')}.` : null,
    };
  });
}
