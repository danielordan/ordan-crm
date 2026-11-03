import { existsSync } from 'node:fs';
import path from 'node:path';
import { validateEnv, type Env } from '../common/config/env.schema';
import { projectRefFromUrl } from './dev-guard';

// Loads backend/.env for command-line scripts (migrate, seed). Variables already set win.
export function loadCliEnv(): Env {
  const envFile = path.resolve(__dirname, '../../.env');
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  return validateEnv(process.env);
}

// Safe description of the target database: project ID and schema, never the URL or password
export function describeTarget(env: Env): string {
  const ref = projectRefFromUrl(env.DATABASE_URL) ?? 'unknown project';
  return `project ${ref}, schema ${env.DATABASE_SCHEMA}`;
}
