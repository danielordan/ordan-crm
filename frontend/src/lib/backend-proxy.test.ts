// @vitest-environment node
import { proxyToBackend } from './backend-proxy';

describe('proxyToBackend', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv('BACKEND_API_URL', 'http://backend.test');
    vi.stubEnv('BACKEND_API_KEY', 'server-side-key');
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function lastCall() {
    const [url, init] = fetchMock.mock.calls[0];
    return { url: String(url), init: init!, headers: new Headers(init!.headers) };
  }

  it('adds the API key and forwards path and query string', async () => {
    fetchMock.mockResolvedValue(Response.json({ status: 'ok' }));
    const request = new Request('http://localhost:3000/api/ping?page=2&search=abc', {
      headers: { authorization: 'Basic abc', cookie: 'a=b' },
    });

    const response = await proxyToBackend(request, '/api/v1/ping');

    const { url, init, headers } = lastCall();
    expect(url).toBe('http://backend.test/api/v1/ping?page=2&search=abc');
    expect(init.method).toBe('GET');
    expect(headers.get('X-API-Key')).toBe('server-side-key');
    expect(headers.get('X-Request-Id')).toBeTruthy();
    expect(headers.get('Authorization')).toBeNull();
    expect(headers.get('Cookie')).toBeNull();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('forwards method, body and content type', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const request = new Request('http://localhost:3000/api/clients/1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.c' }),
    });

    await proxyToBackend(request, '/api/v1/clients/1');

    const { init, headers } = lastCall();
    expect(init.method).toBe('PATCH');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe('{"email":"a@b.c"}');
  });

  it('passes backend error statuses through unchanged', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: 'UNAUTHORIZED' }, { status: 401 }));
    const response = await proxyToBackend(new Request('http://localhost/api/ping'), '/api/v1/ping');
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'UNAUTHORIZED' });
  });

  it('returns 502 without internal details when the backend is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.1:4000'));
    const response = await proxyToBackend(new Request('http://localhost/api/ping'), '/api/v1/ping');
    expect(response.status).toBe(502);
    const body = await response.text();
    expect(body).toContain('BACKEND_UNAVAILABLE');
    expect(body).not.toContain('ECONNREFUSED');
  });

  it('returns 500 when the proxy is not configured', async () => {
    vi.stubEnv('BACKEND_API_KEY', '');
    const response = await proxyToBackend(new Request('http://localhost/api/ping'), '/api/v1/ping');
    expect(response.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
