import 'server-only';

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

function errorResponse(status: number, error: string): Response {
  return Response.json({ error, message: GENERIC_MESSAGE }, { status });
}

// Forwards a browser request to the backend, adding the server-side API key.
// The browser's Authorization and Cookie headers are never forwarded.
export async function proxyToBackend(request: Request, backendPath: string): Promise<Response> {
  const baseUrl = process.env.BACKEND_API_URL;
  const apiKey = process.env.BACKEND_API_KEY;
  if (!baseUrl || !apiKey) {
    console.error('Backend proxy is not configured: BACKEND_API_URL or BACKEND_API_KEY missing');
    return errorResponse(500, 'PROXY_NOT_CONFIGURED');
  }

  const target = new URL(backendPath, baseUrl);
  target.search = new URL(request.url).search;

  const headers = new Headers({ 'X-API-Key': apiKey, 'X-Request-Id': crypto.randomUUID() });
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  let backendResponse: Response;
  try {
    backendResponse = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch (error) {
    console.error('Backend request failed', { path: backendPath, error: String(error) });
    return errorResponse(502, 'BACKEND_UNAVAILABLE');
  }

  const responseHeaders = new Headers();
  const responseType = backendResponse.headers.get('content-type');
  if (responseType) responseHeaders.set('Content-Type', responseType);

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}
