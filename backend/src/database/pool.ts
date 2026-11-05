import { Pool } from 'pg';
import { SUPABASE_CA } from './supabase-ca';

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

export function createPool({ connectionString, schema, max = 5 }: PoolOptions): Pool {
  const pool = new Pool({
    connectionString: withoutSslParams(connectionString),
    // Encrypted and verified: the server certificate must be signed by the Supabase CA
    ssl: { ca: SUPABASE_CA, rejectUnauthorized: true },
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
