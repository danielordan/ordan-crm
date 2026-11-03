import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Pool } from 'pg';

export const MIGRATIONS_DIR = __dirname;
const MIGRATION_FILE = /^\d{3}_[a-z0-9_]+\.sql$/;
// Arbitrary constant key so two runs never apply migrations at the same time
const LOCK_KEY = 4_815_162_342;

export interface Migration {
  id: string;
  sql: string;
}

export interface MigrationResult {
  applied: string[];
  skipped: string[];
}

export function loadMigrations(dir: string = MIGRATIONS_DIR): Migration[] {
  return readdirSync(dir)
    .filter((file) => MIGRATION_FILE.test(file))
    .sort()
    .map((file) => ({
      id: file.replace(/\.sql$/, ''),
      sql: readFileSync(path.join(dir, file), 'utf8'),
    }));
}

// Applies every migration not yet recorded in schema_migrations, each in its own transaction
export async function runMigrations(
  pool: Pool,
  migrations: Migration[] = loadMigrations(),
): Promise<MigrationResult> {
  const client = await pool.connect();
  const result: MigrationResult = { applied: [], skipped: [] };
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         id text PRIMARY KEY,
         applied_at timestamptz NOT NULL DEFAULT now()
       )`,
    );
    const { rows } = await client.query<{ id: string }>('SELECT id FROM schema_migrations');
    const done = new Set(rows.map((row) => row.id));

    for (const migration of migrations) {
      if (done.has(migration.id)) {
        result.skipped.push(migration.id);
        continue;
      }
      try {
        await client.query('BEGIN');
        await client.query(migration.sql);
        await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [migration.id]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${migration.id} failed: ${(error as Error).message}`);
      }
      result.applied.push(migration.id);
    }
    return result;
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => undefined);
    client.release();
  }
}
