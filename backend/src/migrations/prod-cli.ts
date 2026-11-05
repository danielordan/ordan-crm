import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { parseEnv } from 'node:util';
import { createPool } from '../database/pool';
import { checkProductionTarget, redactSecrets } from './production-target';
import { runMigrations } from './runner';

const PRODUCTION_SCHEMA = 'public';

// `npm run db:migrate:prod` (ARCHITECTURE section 21). The connection string is pasted into a
// hidden prompt and kept only in memory: never in a file, in the shell history or on screen.
async function askHidden(question: string): Promise<string> {
  process.stdout.write(question);
  const silent = new Writable({ write: (_chunk, _encoding, done) => done() });
  const prompt = createInterface({ input: process.stdin, output: silent, terminal: true });
  try {
    return (await prompt.question('')).trim();
  } finally {
    prompt.close();
    process.stdout.write('\n');
  }
}

async function ask(question: string): Promise<string> {
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await prompt.question(question)).trim();
  } finally {
    prompt.close();
  }
}

// Only this one variable is taken from backend/.env, to recognize the Development project
function readDevProjectRef(): string | undefined {
  const envFile = path.resolve(__dirname, '../../.env');
  if (!existsSync(envFile)) return undefined;
  return parseEnv(readFileSync(envFile, 'utf8')).DATABASE_DEV_PROJECT_REF?.trim() || undefined;
}

async function printVerification(pool: ReturnType<typeof createPool>): Promise<void> {
  const tables = await pool.query<{ tablename: string; rowsecurity: boolean }>(
    `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = $1 ORDER BY tablename`,
    [PRODUCTION_SCHEMA],
  );
  const indexes = await pool.query<{ tablename: string; indexname: string }>(
    `SELECT tablename, indexname FROM pg_indexes WHERE schemaname = $1 ORDER BY tablename, indexname`,
    [PRODUCTION_SCHEMA],
  );
  console.log('\nTables:');
  for (const { tablename, rowsecurity } of tables.rows) {
    console.log(`  ${tablename} (RLS ${rowsecurity ? 'on' : 'OFF'})`);
  }
  console.log('Indexes:');
  for (const { tablename, indexname } of indexes.rows) {
    console.log(`  ${tablename}: ${indexname}`);
  }
}

async function main(): Promise<void> {
  if (!process.stdin.isTTY) throw new Error('This command must be run in an interactive terminal.');

  const connectionString = await askHidden(
    'Paste the ordan-prod Session pooler connection string (hidden), then press Enter: ',
  );
  const ref = checkProductionTarget(connectionString, readDevProjectRef());
  const answer = await ask(`Run migrations on project ${ref}? Type yes to continue: `);
  if (answer !== 'yes') {
    console.log('Cancelled. Nothing was changed.');
    return;
  }

  try {
    const pool = createPool({ connectionString, schema: PRODUCTION_SCHEMA, max: 1 });
    try {
      const { applied, skipped } = await runMigrations(pool);
      for (const id of skipped) console.log(`  already applied: ${id}`);
      for (const id of applied) console.log(`  applied:         ${id}`);
      await printVerification(pool);
      console.log('\nDone.');
    } finally {
      await pool.end();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(redactSecrets(message, connectionString));
  }
}

main().catch((error: unknown) => {
  console.error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
