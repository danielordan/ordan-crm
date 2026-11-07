import type { Pool } from 'pg';
import { runMigrations } from '../src/migrations/runner';
import { createTestDatabase, dropTestDatabase, TEST_SCHEMA } from './db';

describe('Database migrations (e2e)', () => {
  let pool: Pool | undefined;

  const indexes = async () => {
    const { rows } = await pool!.query<{ indexname: string; indexdef: string }>(
      'SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = $1 ORDER BY indexname',
      [TEST_SCHEMA],
    );
    return rows;
  };

  beforeAll(async () => {
    // Applies all migrations once
    pool = await createTestDatabase();
  });

  afterAll(async () => {
    await dropTestDatabase(pool);
  });

  it('creates all indexes from ARCHITECTURE 11.4–11.6', async () => {
    const byName = Object.fromEntries((await indexes()).map((i) => [i.indexname, i.indexdef]));
    expect(byName.clients_company_email_unique).toMatch(
      /UNIQUE INDEX .* \(company_name_normalized, email_normalized\) WHERE \(\(company_name_normalized IS NOT NULL\) AND \(email_normalized IS NOT NULL\)\)/,
    );
    expect(byName.clients_company_idx).toContain('(company_name_normalized)');
    expect(byName.clients_email_idx).toContain('(email_normalized)');
    expect(byName.clients_date_added_idx).toContain('(date_added DESC, id DESC)');
    expect(byName.clients_status_date_added_idx).toContain(
      '(processing_status, date_added DESC, id DESC)',
    );
    expect(byName.users_google_id_key).toMatch(/UNIQUE INDEX .* \(google_id\)/);
    expect(byName.users_username_unique).toMatch(
      /UNIQUE INDEX .* \(username\) WHERE \(username IS NOT NULL\)/,
    );
  });

  it('enables row level security on every table', async () => {
    const { rows } = await pool!.query<{ relname: string; relrowsecurity: boolean }>(
      `SELECT c.relname, c.relrowsecurity FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = $1 AND c.relkind = 'r' ORDER BY c.relname`,
      [TEST_SCHEMA],
    );
    expect(rows).toEqual([
      { relname: 'clients', relrowsecurity: true },
      { relname: 'schema_migrations', relrowsecurity: true },
      { relname: 'users', relrowsecurity: true },
    ]);
  });

  it('changes nothing when run again', async () => {
    const before = await indexes();
    const result = await runMigrations(pool!);
    expect(result.applied).toEqual([]);
    expect(result.skipped).toContain('001_initial');
    expect(await indexes()).toEqual(before);
  });

  it('rejects a second client with the same company and email', async () => {
    const insert = (id: string) =>
      pool!.query(
        `INSERT INTO clients (id, company_name_normalized, email_normalized, processing_status)
         VALUES ($1, 'acme', 'a@acme.com', 'Success')`,
        [id],
      );
    await insert('20000000-0000-4000-8000-000000000001');
    await expect(insert('20000000-0000-4000-8000-000000000002')).rejects.toMatchObject({
      code: '23505',
    });
  });
});
