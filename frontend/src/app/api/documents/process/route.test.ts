// @vitest-environment node
import { maxDuration, POST } from './route';

describe('/api/documents/process', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv('BACKEND_API_URL', 'http://backend.test');
    vi.stubEnv('BACKEND_API_KEY', 'server-side-key');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockImplementation(() => Promise.resolve(Response.json({ result: 'duplicate' })));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('allows more time than the backend takes', () => {
    expect(maxDuration).toBe(130);
  });

  it('forwards the upload with the API key and the original content type', async () => {
    const contentType = 'multipart/form-data; boundary=abc';
    const response = await POST(
      new Request('http://frontend.test/api/documents/process', {
        method: 'POST',
        headers: { 'Content-Type': contentType, Cookie: 'session=secret' },
        body: 'file-bytes',
      }),
    );

    const [url, init] = fetchMock.mock.calls[0];
    const headers = init?.headers as Headers;
    expect(String(url)).toBe('http://backend.test/api/v1/documents/process');
    expect(init?.method).toBe('POST');
    expect(headers.get('X-API-Key')).toBe('server-side-key');
    expect(headers.get('Content-Type')).toBe(contentType);
    expect(headers.get('Cookie')).toBeNull();
    expect(new TextDecoder().decode(init?.body as ArrayBuffer)).toBe('file-bytes');
    await expect(response.json()).resolves.toEqual({ result: 'duplicate' });
  });
});
