import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';

// Test-only settings, loaded before AppModule is imported (ConfigModule validates on import)
process.env.BACKEND_API_KEY = 'e2e-test-api-key-0123456789';
process.env.LOG_LEVEL = 'silent';
process.env.NODE_ENV = 'test';

// Integration tests run against the Supabase Development project, inside a temporary schema
// that test/db.ts creates and drops (ARCHITECTURE ADR-20). Only the database settings are
// taken from backend/.env.
const envFile = path.resolve(__dirname, '../.env');
if (existsSync(envFile)) {
  const fileEnv = parseEnv(readFileSync(envFile, 'utf8'));
  for (const key of ['DATABASE_URL', 'DATABASE_DEV_PROJECT_REF'] as const) {
    if (!process.env[key] && fileEnv[key]) process.env[key] = fileEnv[key];
  }
}
process.env.DATABASE_SCHEMA = `test_${randomBytes(6).toString('hex')}`;
