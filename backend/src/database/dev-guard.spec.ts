import { assertDevelopmentDatabase, projectRefFromUrl } from './dev-guard';

const DEV = 'devref123';
const pooler = (ref: string) =>
  `postgresql://postgres.${ref}:secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`;
const direct = (ref: string) => `postgresql://postgres:secret@db.${ref}.supabase.co:5432/postgres`;

describe('projectRefFromUrl', () => {
  it('reads the project ID from pooler and direct URLs', () => {
    expect(projectRefFromUrl(pooler('abc'))).toBe('abc');
    expect(projectRefFromUrl(direct('xyz'))).toBe('xyz');
  });

  it('returns null for other URLs', () => {
    expect(projectRefFromUrl('postgresql://postgres:pw@localhost:5432/postgres')).toBeNull();
    expect(projectRefFromUrl('not a url')).toBeNull();
  });
});

describe('assertDevelopmentDatabase', () => {
  it('allows the Development project', () => {
    expect(
      assertDevelopmentDatabase({ DATABASE_URL: pooler(DEV), DATABASE_DEV_PROJECT_REF: DEV }),
    ).toBe(DEV);
    expect(
      assertDevelopmentDatabase({ DATABASE_URL: direct(DEV), DATABASE_DEV_PROJECT_REF: DEV }),
    ).toBe(DEV);
  });

  it('blocks another project (e.g. Production)', () => {
    expect(() =>
      assertDevelopmentDatabase({ DATABASE_URL: pooler('prodref'), DATABASE_DEV_PROJECT_REF: DEV }),
    ).toThrow(/Development/);
  });

  it('blocks when the Development project ID is not configured', () => {
    expect(() => assertDevelopmentDatabase({ DATABASE_URL: pooler(DEV) })).toThrow(
      /DATABASE_DEV_PROJECT_REF/,
    );
  });

  it('blocks in production mode', () => {
    expect(() =>
      assertDevelopmentDatabase({
        DATABASE_URL: pooler(DEV),
        DATABASE_DEV_PROJECT_REF: DEV,
        NODE_ENV: 'production',
      }),
    ).toThrow(/production/);
  });

  it('never includes the URL or password in the error', () => {
    expect(() =>
      assertDevelopmentDatabase({ DATABASE_URL: pooler('prodref'), DATABASE_DEV_PROJECT_REF: DEV }),
    ).toThrow(expect.not.objectContaining({ message: expect.stringContaining('secret') }) as Error);
  });
});
