import { proxyToBackend } from '@/lib/backend-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Client details, edit and delete (ARCHITECTURE 5.3). The ID goes into the backend path, so
// anything but a UUID stops here and cannot point the request at another backend route.
async function forward(request: Request, { params }: RouteContext): Promise<Response> {
  const { id } = await params;
  if (!UUID.test(id)) {
    return Response.json({ error: 'BAD_REQUEST', message: 'Invalid client ID.' }, { status: 400 });
  }
  return proxyToBackend(request, `/api/v1/clients/${id}`);
}

export const GET = forward;
export const PATCH = forward;
export const DELETE = forward;
