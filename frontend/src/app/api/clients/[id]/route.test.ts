// @vitest-environment node
import { DELETE, GET, PATCH } from './route';

const currentUserId = vi.hoisted(() => vi.fn<() => Promise<string | undefined>>());
vi.mock('@/lib/session-user', () => ({ currentUserId }));

const ID = '00000000-0000-4000-8000-000000000001';
const context = (id: string) => ({ params: Promise.resolve({ id }) });

describe('/api/clients/[id]', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv('BACKEND_API_URL', 'http://backend.test');
    vi.stubEnv('BACKEND_API_KEY', 'server-side-key');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    currentUserId.mockReset();
    currentUserId.mockResolvedValue(undefined);
    fetchMock.mockImplementation(() => Promise.resolve(Response.json({ ok: true })));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each([
    ['GET', GET],
    ['PATCH', PATCH],
    ['DELETE', DELETE],
  ] as const)('forwards %s to the backend client', async (method, handler) => {
    const request = new Request(`http://localhost/api/clients/${ID}`, {
      method,
      body: method === 'PATCH' ? '{}' : undefined,
    });
    const response = await handler(request, context(ID));

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`http://backend.test/api/v1/clients/${ID}`);
    expect(init?.method).toBe(method);
  });

  it.each(['abc', '..', '../users/google-sign-in', `${ID}/x`])(
    'returns 400 for %s without calling the backend',
    async (id) => {
      const response = await GET(new Request('http://localhost/api/clients/x'), context(id));
      expect(response.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});
