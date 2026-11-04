import { ClientStatusService } from '../clients/client-status.service';
import type { ClientFields } from '../clients/client.types';
import { normalizeCompanyName, normalizeEmail, phoneToDigits } from '../common/text/normalize';

// Test clients for the Development database only. Fixed IDs let the seed replace its own
// rows on every run without touching anything else.

export interface SeedClient extends ClientFields {
  id: string;
  companyNameNormalized: string | null;
  emailNormalized: string | null;
  phoneDigits: string | null;
  dateAdded: Date;
  processingStatus: 'Success' | 'Failed';
  errorDetails: string | null;
}

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
function buildInput(n: number): ClientFields {
  const company = COMPANIES[n % COMPANIES.length];
  const branch = Math.floor(n / COMPANIES.length);
  const companyName = branch === 0 ? company : `${company} ${['North', 'South'][branch - 1]}`;
  const slug = companyName.toLowerCase().replace(/[^a-z]+/g, '');
  const [originPort, originCountry] = ORIGINS[n % ORIGINS.length];

  const input: ClientFields = {
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
    const missing: (keyof ClientFields)[][] = [
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
  const status = new ClientStatusService();
  return Array.from({ length: SEED_COUNT }, (_, n) => {
    const input = buildInput(n);
    return {
      ...input,
      id: seedId(n),
      companyNameNormalized: normalizeCompanyName(input.companyName),
      emailNormalized: normalizeEmail(input.email),
      phoneDigits: phoneToDigits(input.phone),
      // Spread over about four months, at varying times of day
      dateAdded: new Date(FIRST_DATE + n * 2 * 86_400_000 + (n % 9) * 3_700_000),
      ...status.compute(input),
    };
  });
}
