import 'server-only';

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string | null;
}

export interface PasswordCredentials {
  username: string;
  password: string;
}

export interface BackendUser {
  id: string;
  username: string | null;
}

// Server-to-server call to the backend users endpoints (ARCHITECTURE 12.3).
// These endpoints have no proxy route for the browser.
function postToUsers(path: string, body: object): Promise<Response> {
  const baseUrl = process.env.BACKEND_API_URL;
  const apiKey = process.env.BACKEND_API_KEY;
  if (!baseUrl || !apiKey) throw new Error('BACKEND_API_URL or BACKEND_API_KEY missing');

  return fetch(new URL(`/api/v1/users/${path}`, baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
}

// Registers (or updates) the Google user in the backend `users` table; returns its internal ID
export async function registerGoogleUser(user: GoogleUser): Promise<{ id: string }> {
  const response = await postToUsers('google-sign-in', user);
  if (!response.ok) throw new Error(`User registration failed with status ${response.status}`);
  const { id } = (await response.json()) as BackendUser;
  return { id };
}

// Creates a username + password user. Returns 'taken' when the username already exists.
export async function registerPasswordUser(
  credentials: PasswordCredentials,
): Promise<'created' | 'taken'> {
  const response = await postToUsers('register', credentials);
  if (response.status === 409) return 'taken';
  if (!response.ok) throw new Error(`Sign up failed with status ${response.status}`);
  return 'created';
}

// Returns the user for correct credentials, or null when they are wrong
export async function verifyPasswordUser(
  credentials: PasswordCredentials,
): Promise<BackendUser | null> {
  const response = await postToUsers('password-sign-in', credentials);
  if (response.status === 401 || response.status === 400) return null;
  if (!response.ok) throw new Error(`Password sign-in failed with status ${response.status}`);
  const user = (await response.json()) as BackendUser;
  return { id: user.id, username: user.username };
}
