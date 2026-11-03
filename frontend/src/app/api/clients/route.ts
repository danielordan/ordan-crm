import { proxyToBackend } from '@/lib/backend-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Clients list (ARCHITECTURE 5.3). The query string is forwarded as is; the backend validates it.
export function GET(request: Request): Promise<Response> {
  return proxyToBackend(request, '/api/v1/clients');
}
