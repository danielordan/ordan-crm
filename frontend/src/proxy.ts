import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_REALM, checkBasicAuth } from '@/lib/basic-auth';

// Next.js 16 "Proxy" (formerly Middleware). No matcher: every request is protected.
export function proxy(request: NextRequest): NextResponse {
  const result = checkBasicAuth(request.headers.get('authorization'), process.env.SITE_PASSWORD);

  if (result === 'ok') return NextResponse.next();

  if (result === 'not_configured') {
    // Fail closed when the password is missing
    return new NextResponse('Site password is not configured.', { status: 500 });
  }

  return new NextResponse('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': `Basic realm="${AUTH_REALM}", charset="UTF-8"` },
  });
}
