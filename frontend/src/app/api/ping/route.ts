import { proxyToBackend } from '@/lib/backend-proxy';

// Internal route used to verify the backend proxy in Milestone 1. Remove in Milestone 2.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(request: Request): Promise<Response> {
  return proxyToBackend(request, '/api/v1/ping');
}
