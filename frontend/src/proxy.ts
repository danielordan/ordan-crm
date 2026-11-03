import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { decideAccess } from '@/lib/access';

// Next.js 16 "Proxy" (formerly Middleware). No matcher: every request is checked for a
// Google sign-in session. Without one, pages redirect to /sign-in and /api/* returns 401.
export const proxy = auth((request) => {
  const { pathname, search } = request.nextUrl;
  const decision = decideAccess(pathname, search, Boolean(request.auth));

  if (decision.type === 'allow') return NextResponse.next();
  if (decision.type === 'unauthorized') {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Authentication required.' },
      { status: 401 },
    );
  }
  return NextResponse.redirect(new URL(decision.location, request.nextUrl.origin));
});
