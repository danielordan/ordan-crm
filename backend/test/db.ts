import type { Pool } from 'pg';
import { assertDevelopmentDatabase } from '../src/database/dev-guard';
import { createPool } from '../src/database/pool';
import { runMigrations } from '../src/migrations/runner';
import type { SeedClient } from '../src/seed/seed-data';
import { insertSeedClients } from '../src/seed/seed';
import { normalizeCompanyName, normalizeEmail, phoneToDigits } from '../src/common/text/normalize';

export const TEST_SCHEMA = process.env.DATABASE_SCHEMA as string;

// Creates this test file's temporary schema in the Development project and migrates it.
// Fails loudly (never skips) when the database is not configured.
export async function createTestDatabase(): Promise<Pool> {
  if (!process.env.DATABASE_URL || !process.env.DATABASE_DEV_PROJECT_REF) {
    throw new Error(
      'Integration tests need DATABASE_URL and DATABASE_DEV_PROJECT_REF in backend/.env (Supabase Development).',
    );
  }
  assertDevelopmentDatabase(process.env);
  const pool = createPool({ connectionString: process.env.DATABASE_URL, schema: TEST_SCHEMA });
  await pool.query(`CREATE SCHEMA "${TEST_SCHEMA}"`);
  await runMigrations(pool);
  return pool;
}

export async function dropTestDatabase(pool: Pool | undefined): Promise<void> {
  if (!pool) return;
  await pool.query(`DROP SCHEMA IF EXISTS "${TEST_SCHEMA}" CASCADE`);
  await pool.end();
}

let counter = 0;

// Builds a client row for fixtures; derived columns are computed like the real code does
export function testClient(fields: Partial<SeedClient> = {}): SeedClient {
  counter += 1;
  const base = {
    id: `10000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    companyName: `Company ${counter}`,
    address: null,
    phone: null,
    email: `c${counter}@example.com`,
    originPort: 'Shanghai',
    originCountry: 'China',
    destinationPort: 'Haifa',
    incoterms: 'FOB',
    shipmentType: 'FCL' as const,
    dateAdded: new Date(Date.UTC(2026, 0, 1) + counter * 60_000),
    processingStatus: 'Success' as const,
    errorDetails: null,
    ...fields,
  };
  return {
    ...base,
    companyNameNormalized: normalizeCompanyName(base.companyName),
    emailNormalized: normalizeEmail(base.email),
    phoneDigits: phoneToDigits(base.phone),
  };
}

export async function insertClients(pool: Pool, clients: SeedClient[]): Promise<void> {
  await pool.query('TRUNCATE clients');
  await insertSeedClients(pool, clients);
}
