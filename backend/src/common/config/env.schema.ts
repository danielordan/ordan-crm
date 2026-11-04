import { z } from 'zod';

const optionalString = z.string().trim().min(1).optional();

// Environment variables from ARCHITECTURE section 19.
// Variables used by later milestones stay optional until that milestone needs them.
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BACKEND_API_KEY: z.string().min(16, 'must be at least 16 characters'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(4194304),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
  DATABASE_URL: z.string().trim().min(1, 'is required'),
  // Supabase project ID of the Development database (ARCHITECTURE ADR-20); required by seed and tests
  DATABASE_DEV_PROJECT_REF: optionalString,
  // Postgres schema for all tables; tests use a temporary one
  DATABASE_SCHEMA: z
    .string()
    .regex(/^[a-z_][a-z0-9_]{0,62}$/, 'must be a lowercase Postgres identifier')
    .default('public'),
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: optionalString,
  OPENAI_EXTRACTION_PROMPT_VERSION: optionalString,
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  // Treat empty values from .env (e.g. "OPENAI_API_KEY=") as not set
  const cleaned = Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== ''));
  const result = envSchema.safeParse(cleaned);
  if (!result.success) {
    // Report variable names only, never their values
    const problems = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${problems}`);
  }
  return result.data;
}
