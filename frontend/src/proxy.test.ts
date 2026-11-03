// @vitest-environment node
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

const auth = (password: string) => ({ authorization: `Basic ${btoa(`user:${password}`)}` });

describe('proxy (Basic Auth)', () => {
  beforeEach(() => vi.stubEnv('SITE_PASSWORD', 'secret-pass'));
  afterEach(() => vi.unstubAllEnvs());

  it('asks the browser for a password when none is given', () => {
    const response = proxy(new NextRequest('http://localhost/clients'));
    expect(response.status).toBe(401);
    expect(response.headers.get('WWW-Authenticate')).toMatch(/^Basic realm=/);
  });

  it('blocks a wrong password', () => {
    const response = proxy(new NextRequest('http://localhost/clients', { headers: auth('nope') }));
    expect(response.status).toBe(401);
  });

  it('lets the correct password through', () => {
    const response = proxy(
      new NextRequest('http://localhost/clients', { headers: auth('secret-pass') }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('blocks everything when SITE_PASSWORD is missing', () => {
    vi.stubEnv('SITE_PASSWORD', '');
    const response = proxy(new NextRequest('http://localhost/clients', { headers: auth('') }));
    expect(response.status).toBe(500);
  });
});
