import type { Pool } from 'pg';
import { loadMigrations, runMigrations } from './runner';

function fakePool(appliedIds: string[], failOn?: string) {
  const queries: string[] = [];
  const client = {
    query: jest.fn((text: string) => {
      queries.push(text.trim());
      if (failOn && text.includes(failOn)) return Promise.reject(new Error('syntax error'));
      if (text.startsWith('SELECT id FROM schema_migrations')) {
        return Promise.resolve({ rows: appliedIds.map((id) => ({ id })) });
      }
      return Promise.resolve({ rows: [] });
    }),
    release: jest.fn(),
  };
  const pool = { connect: jest.fn().mockResolvedValue(client) } as unknown as Pool;
  return { pool, client, queries };
}

const migrations = [
  { id: '001_initial', sql: 'CREATE TABLE a ()' },
  { id: '002_more', sql: 'CREATE TABLE b ()' },
];

describe('runMigrations', () => {
  it('applies only migrations that were not applied yet, each in a transaction', async () => {
    const { pool, client, queries } = fakePool(['001_initial']);

    const result = await runMigrations(pool, migrations);

    expect(result).toEqual({ applied: ['002_more'], skipped: ['001_initial'] });
    expect(queries).not.toContain('CREATE TABLE a ()');
    const start = queries.indexOf('BEGIN');
    expect(queries.slice(start, start + 4)).toEqual([
      'BEGIN',
      'CREATE TABLE b ()',
      'INSERT INTO schema_migrations (id) VALUES ($1)',
      'COMMIT',
    ]);
    expect(client.release).toHaveBeenCalled();
  });

  it('does nothing when everything is applied', async () => {
    const { pool, queries } = fakePool(['001_initial', '002_more']);
    const result = await runMigrations(pool, migrations);
    expect(result.applied).toEqual([]);
    expect(queries).not.toContain('BEGIN');
  });

  it('rolls back and reports a failing migration', async () => {
    const { pool, client, queries } = fakePool([], 'CREATE TABLE b');
    await expect(runMigrations(pool, migrations)).rejects.toThrow(/002_more failed/);
    expect(queries).toContain('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });
});

describe('loadMigrations', () => {
  it('loads the SQL files in order', () => {
    const ids = loadMigrations().map((m) => m.id);
    expect(ids[0]).toBe('001_initial');
    expect([...ids].sort()).toEqual(ids);
  });
});
