import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

// Supabase Root CA (public), downloaded from the Supabase dashboard (ARCHITECTURE ADR-19)
export const SUPABASE_CA_PATH = path.resolve(__dirname, '../../certs/supabase-ca.crt');

export interface PoolOptions {
  connectionString: string;
  schema: string;
  max?: number;
}

// SSL settings in the URL would override the verified SSL config below
function withoutSslParams(connectionString: string): string {
  const url = new URL(connectionString);
  for (const param of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'uselibpqcompat']) {
    url.searchParams.delete(param);
  }
  return url.toString();
}

function readCa(): string {
  try {
    return readFileSync(SUPABASE_CA_PATH, 'utf8');
  } catch {
    throw new Error(`Database SSL certificate not found at backend/certs/supabase-ca.crt`);
  }
}

export function createPool({ connectionString, schema, max = 5 }: PoolOptions): Pool {
  const pool = new Pool({
    connectionString: withoutSslParams(connectionString),
    // Encrypted and verified: the server certificate must be signed by the Supabase CA
    ssl: { ca: readCa(), rejectUnauthorized: true },
    max,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    // pg-pool awaits this before handing out the new client (@types/pg types it as void).
    // `schema` is validated as a plain identifier by env.schema.ts.
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    onConnect: async (client) => {
      await client.query(`SET search_path TO "${schema}"`);
    },
  });

  // Idle client errors (e.g. the server closed the connection) must not crash the process
  pool.on('error', () => undefined);

  return pool;
}
