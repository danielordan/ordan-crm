import { validateEnv } from './env.schema';

describe('validateEnv', () => {
  const DATABASE_URL = 'postgresql://user:pass@host:5432/postgres';
  const OPENAI_API_KEY = 'test-openai-key';

  it('requires BACKEND_API_KEY', () => {
    expect(() => validateEnv({ DATABASE_URL, OPENAI_API_KEY })).toThrow(/BACKEND_API_KEY/);
  });

  it('requires DATABASE_URL', () => {
    expect(() => validateEnv({ BACKEND_API_KEY: 'a'.repeat(32), OPENAI_API_KEY })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('rejects a short BACKEND_API_KEY', () => {
    expect(() => validateEnv({ BACKEND_API_KEY: 'short', DATABASE_URL, OPENAI_API_KEY })).toThrow(
      /BACKEND_API_KEY/,
    );
  });

  it('rejects an unsafe DATABASE_SCHEMA', () => {
    expect(() =>
      validateEnv({
        BACKEND_API_KEY: 'a'.repeat(32),
        DATABASE_URL,
        OPENAI_API_KEY,
        DATABASE_SCHEMA: 'x; drop',
      }),
    ).toThrow(/DATABASE_SCHEMA/);
  });

  it('does not include values in the error message', () => {
    expect(() =>
      validateEnv({ BACKEND_API_KEY: 'tiny-secret', DATABASE_URL, OPENAI_API_KEY }),
    ).toThrow(
      expect.not.objectContaining({ message: expect.stringContaining('tiny-secret') }) as Error,
    );
  });

  it('applies defaults and treats empty values as unset', () => {
    const env = validateEnv({
      BACKEND_API_KEY: 'a'.repeat(32),
      DATABASE_URL,
      OPENAI_API_KEY,
      OPENAI_MODEL: '',
      API_PORT: '',
    });
    expect(env.API_PORT).toBe(4000);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.MAX_UPLOAD_BYTES).toBe(4194304);
    expect(env.OPENAI_TIMEOUT_MS).toBe(60000);
    expect(env.DATABASE_SCHEMA).toBe('public');
    expect(env.OPENAI_MODEL).toBe('gpt-5.4-mini');
    expect(env.OPENAI_EXTRACTION_PROMPT_VERSION).toBe('v4');
  });

  it('requires OPENAI_API_KEY, also when left empty', () => {
    const base = { BACKEND_API_KEY: 'a'.repeat(32), DATABASE_URL };
    expect(() => validateEnv(base)).toThrow(/OPENAI_API_KEY/);
    expect(() => validateEnv({ ...base, OPENAI_API_KEY: '' })).toThrow(/OPENAI_API_KEY/);
  });
});
