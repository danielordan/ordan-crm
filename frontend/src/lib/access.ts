// Which requests need a session, and what happens without one (ARCHITECTURE 5.1, 16.1)

const PUBLIC_PREFIXES = ['/api/auth/', '/_next/'];
const PUBLIC_PATHS = ['/sign-in', '/favicon.ico', '/icon.svg', '/robots.txt'];

export const SIGN_IN_PATH = '/sign-in';
export const HOME_PATH = '/clients';

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export type AccessDecision =
  { type: 'allow' } | { type: 'unauthorized' } | { type: 'redirect'; location: string };

export function decideAccess(pathname: string, search: string, signedIn: boolean): AccessDecision {
  if (pathname === SIGN_IN_PATH) {
    return signedIn ? { type: 'redirect', location: HOME_PATH } : { type: 'allow' };
  }
  if (signedIn || isPublicPath(pathname)) return { type: 'allow' };
  if (pathname === '/api' || pathname.startsWith('/api/')) return { type: 'unauthorized' };
  const callbackUrl = encodeURIComponent(`${pathname}${search}`);
  return { type: 'redirect', location: `${SIGN_IN_PATH}?callbackUrl=${callbackUrl}` };
}

// Only same-site relative paths are allowed as a destination after sign-in
export function safeCallbackUrl(value: string | string[] | undefined): string {
  const url = Array.isArray(value) ? value[0] : value;
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.startsWith('/\\')) {
    return HOME_PATH;
  }
  return url;
}
