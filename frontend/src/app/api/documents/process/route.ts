import { proxyToBackend } from '@/lib/backend-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Above the backend's 120 seconds, so the browser always gets the backend's answer (ARCHITECTURE 7.5)
export const maxDuration = 130;

export function POST(request: Request): Promise<Response> {
  return proxyToBackend(request, '/api/v1/documents/process');
}
