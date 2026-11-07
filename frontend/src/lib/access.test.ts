import { decideAccess, isPublicPath, safeCallbackUrl } from './access';

describe('isPublicPath', () => {
  it.each([
    '/sign-in',
    '/sign-up',
    '/api/auth/session',
    '/_next/static/a.js',
    '/favicon.ico',
    '/icon.svg',
  ])('%s is public', (path) => expect(isPublicPath(path)).toBe(true));

  it.each([
    '/',
    '/clients',
    '/clients/1',
    '/upload',
    '/api/clients',
    '/sign-in-other',
    '/api/authx',
  ])('%s needs a session', (path) => expect(isPublicPath(path)).toBe(false));
});

describe('decideAccess', () => {
  it('redirects pages and rejects API calls without a session', () => {
    expect(decideAccess('/upload', '', false)).toEqual({
      type: 'redirect',
      location: '/sign-in?callbackUrl=%2Fupload',
    });
    expect(decideAccess('/api/clients', '?page=2', false)).toEqual({ type: 'unauthorized' });
  });

  it('allows everything with a session, and skips the sign-in page', () => {
    expect(decideAccess('/clients', '', true)).toEqual({ type: 'allow' });
    expect(decideAccess('/sign-in', '', true)).toEqual({ type: 'redirect', location: '/clients' });
    expect(decideAccess('/sign-up', '', true)).toEqual({ type: 'redirect', location: '/clients' });
    expect(decideAccess('/sign-up', '', false)).toEqual({ type: 'allow' });
  });
});

describe('safeCallbackUrl', () => {
  it('keeps same-site paths', () => {
    expect(safeCallbackUrl('/clients?page=2')).toBe('/clients?page=2');
  });

  it.each([undefined, '', 'https://evil.example', '//evil.example', '/\\evil.example'])(
    'falls back to /clients for %p',
    (value) => expect(safeCallbackUrl(value)).toBe('/clients'),
  );
});
