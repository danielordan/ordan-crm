import { validateEnv } from './env.schema';

describe('validateEnv', () => {
  it('requires BACKEND_API_KEY', () => {
    expect(() => validateEnv({})).toThrow(/BACKEND_API_KEY/);
  });

  it('rejects a short BACKEND_API_KEY', () => {
    expect(() => validateEnv({ BACKEND_API_KEY: 'short' })).toThrow(/BACKEND_API_KEY/);
  });

  it('does not include values in the error message', () => {
    expect(() => validateEnv({ BACKEND_API_KEY: 'tiny-secret' })).toThrow(
      expect.not.objectContaining({ message: expect.stringContaining('tiny-secret') }) as Error,
    );
  });

  it('applies defaults and treats empty values as unset', () => {
    const env = validateEnv({ BACKEND_API_KEY: 'a'.repeat(32), MONGODB_URI: '', API_PORT: '' });
    expect(env.API_PORT).toBe(4000);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.MAX_UPLOAD_BYTES).toBe(4194304);
    expect(env.OPENAI_TIMEOUT_MS).toBe(60000);
    expect(env.MONGODB_URI).toBeUndefined();
  });
});
