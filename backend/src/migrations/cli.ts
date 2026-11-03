import { describeTarget, loadCliEnv } from '../database/cli-env';
import { createPool } from '../database/pool';
import { runMigrations } from './runner';

// `npm run db:migrate`: applies pending migrations to the database in DATABASE_URL
async function main(): Promise<void> {
  const env = loadCliEnv();
  console.log(`Running migrations on ${describeTarget(env)}`);
  const pool = createPool({ connectionString: env.DATABASE_URL, schema: env.DATABASE_SCHEMA });
  try {
    const { applied, skipped } = await runMigrations(pool);
    for (const id of skipped) console.log(`  already applied: ${id}`);
    for (const id of applied) console.log(`  applied:         ${id}`);
    console.log(applied.length ? 'Done.' : 'Nothing to apply. Database is up to date.');
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
