import { checkProductionTarget, redactSecrets } from './production-target';

describe('checkProductionTarget', () => {
  const session = (ref: string, port = 5432): string =>
    `postgresql://postgres.${ref}:s3cret-value@aws-0-eu.pooler.supabase.com:${port}/postgres`;

  it('returns the project ID of a Session pooler string', () => {
    expect(checkProductionTarget(session('prodref'), 'devref')).toBe('prodref');
  });

  it('refuses the Development project', () => {
    expect(() => checkProductionTarget(session('devref'), 'devref')).toThrow(/Development/);
  });

  it('refuses when Development cannot be ruled out', () => {
    expect(() => checkProductionTarget(session('prodref'), undefined)).toThrow(
      /DATABASE_DEV_PROJECT_REF/,
    );
  });

  it('refuses the Transaction pooler', () => {
    expect(() => checkProductionTarget(session('prodref', 6543), 'devref')).toThrow(/Session/);
  });

  it('refuses a string that still has the password placeholder', () => {
    const pasted = 'postgresql://postgres.prodref:[YOUR-PASSWORD]@host:5432/postgres';
    expect(() => checkProductionTarget(pasted, 'devref')).toThrow(/YOUR-PASSWORD/);
  });

  it.each(['', 'not a url', 'https://example.com', 'postgresql://user:pw@host:5432/postgres'])(
    'refuses %j',
    (pasted) => {
      expect(() => checkProductionTarget(pasted, 'devref')).toThrow();
    },
  );

  it('never repeats the pasted value in a message', () => {
    for (const pasted of [
      session('devref'),
      session('prodref', 6543),
      'junk-s3cret-value',
      'postgresql://postgres:s3cret-value@host:5432/postgres',
    ]) {
      try {
        checkProductionTarget(pasted, 'devref');
        throw new Error('expected a refusal');
      } catch (error) {
        expect((error as Error).message).not.toContain('s3cret-value');
      }
    }
  });
});

describe('redactSecrets', () => {
  const url = 'postgresql://postgres.ref:p%40ss-word@host:5432/postgres';

  it('removes the connection string and the password, encoded or not', () => {
    const safe = redactSecrets(`failed ${url} and p%40ss-word and p@ss-word`, url);
    expect(safe).not.toContain('ss-word');
    expect(safe).toContain('failed');
  });

  it('leaves other messages unchanged', () => {
    expect(redactSecrets('connection timeout', url)).toBe('connection timeout');
  });
});
