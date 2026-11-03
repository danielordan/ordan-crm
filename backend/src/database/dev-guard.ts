// Protects Production from the seed script and integration tests (ARCHITECTURE ADR-20).
// Supabase connection strings carry the project ID either in the pooler user name
// (postgres.<ref>) or in the direct host (db.<ref>.supabase.co).
export function projectRefFromUrl(connectionString: string): string | null {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return null;
  }
  const user = decodeURIComponent(url.username);
  const fromUser = /^[^.]+\.([a-z0-9]+)$/.exec(user);
  if (fromUser) return fromUser[1];
  const fromHost = /^db\.([a-z0-9]+)\.supabase\.co$/.exec(url.hostname);
  return fromHost ? fromHost[1] : null;
}

export function assertDevelopmentDatabase(env: {
  DATABASE_URL?: string;
  DATABASE_DEV_PROJECT_REF?: string;
  NODE_ENV?: string;
}): string {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to run: NODE_ENV is production.');
  }
  const expected = env.DATABASE_DEV_PROJECT_REF?.trim();
  if (!expected) {
    throw new Error('Refusing to run: DATABASE_DEV_PROJECT_REF is not set in backend/.env.');
  }
  if (!env.DATABASE_URL) {
    throw new Error('Refusing to run: DATABASE_URL is not set in backend/.env.');
  }
  const actual = projectRefFromUrl(env.DATABASE_URL);
  if (actual !== expected) {
    throw new Error(
      'Refusing to run: DATABASE_URL does not point to the Development project (DATABASE_DEV_PROJECT_REF).',
    );
  }
  return actual;
}
