export const AUTH_REALM = 'Ordan Cargo Future Clients';

export type BasicAuthResult = 'ok' | 'unauthorized' | 'not_configured';

// Compares strings without returning early, so timing does not reveal how much matched
function constantTimeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

function decodeBase64(value: string): string | null {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

// The username is ignored; only the shared password is checked
export function checkBasicAuth(
  authorizationHeader: string | null,
  sitePassword: string | undefined,
): BasicAuthResult {
  if (!sitePassword) return 'not_configured';
  if (!authorizationHeader) return 'unauthorized';

  const [scheme, encoded] = authorizationHeader.split(' ');
  if (scheme?.toLowerCase() !== 'basic' || !encoded) return 'unauthorized';

  const decoded = decodeBase64(encoded);
  if (decoded === null) return 'unauthorized';

  const separator = decoded.indexOf(':');
  if (separator === -1) return 'unauthorized';

  const password = decoded.slice(separator + 1);
  return constantTimeEqual(password, sitePassword) ? 'ok' : 'unauthorized';
}
