import { describeTarget, loadCliEnv } from '../database/cli-env';
import { assertDevelopmentDatabase } from '../database/dev-guard';
import { createPool } from '../database/pool';
import { buildSeedClients } from './seed-data';
import { insertSeedClients } from './seed';

// `npm run db:seed`: test clients for the Development database only (ARCHITECTURE ADR-20)
async function main(): Promise<void> {
  const env = loadCliEnv();
  assertDevelopmentDatabase(env);
  console.log(`Seeding ${describeTarget(env)}`);

  const clients = buildSeedClients();
  const pool = createPool({ connectionString: env.DATABASE_URL, schema: env.DATABASE_SCHEMA });
  try {
    await insertSeedClients(pool, clients);
  } finally {
    await pool.end();
  }
  const failed = clients.filter((c) => c.processingStatus === 'Failed').length;
  console.log(
    `Done: ${clients.length} test clients (${clients.length - failed} Success, ${failed} Failed).`,
  );
}

main().catch((error: unknown) => {
  console.error(`Seed failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
