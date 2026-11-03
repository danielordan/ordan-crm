// @vitest-environment node
import { NextRequest } from 'next/server';

const session = vi.hoisted(() => ({ value: null as object | null }));

// Auth.js decodes the session cookie; here the session is set directly
vi.mock('@/auth', () => ({
  auth: (handler: (req: NextRequest & { auth: object | null }) => Response) => (req: NextRequest) =>
    handler(Object.assign(req, { auth: session.value })),
}));

const { proxy } = await import('./proxy');

const call = (path: string) =>
  (proxy as unknown as (req: NextRequest) => Response)(
    new NextRequest(`http://localhost:3000${path}`),
  );

describe('proxy (session check)', () => {
  beforeEach(() => {
    session.value = null;
  });

  it('redirects pages to /sign-in with the original path', () => {
    const response = call('/clients?page=2');
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/sign-in?callbackUrl=%2Fclients%3Fpage%3D2',
    );
  });

  it('returns 401 JSON for /api/* without a session', async () => {
    const response = call('/api/clients');
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: 'UNAUTHORIZED',
      message: 'Authentication required.',
    });
  });

  it.each(['/sign-in', '/api/auth/callback/google', '/_next/static/chunk.js', '/icon.svg'])(
    'lets %s through without a session',
    (path) => {
      expect(call(path).headers.get('x-middleware-next')).toBe('1');
    },
  );

  it('lets signed-in users through', () => {
    session.value = { user: { email: 'a@b.com' } };
    expect(call('/clients').headers.get('x-middleware-next')).toBe('1');
    expect(call('/api/clients').headers.get('x-middleware-next')).toBe('1');
  });

  it('sends signed-in users from /sign-in to /clients', () => {
    session.value = { user: { email: 'a@b.com' } };
    expect(call('/sign-in').headers.get('location')).toBe('http://localhost:3000/clients');
  });
});
