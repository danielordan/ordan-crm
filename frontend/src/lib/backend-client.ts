import 'server-only';

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string | null;
}

// Registers (or updates) the Google user in the backend `users` table (ARCHITECTURE 12.3).
// Server-to-server only; this endpoint has no proxy route for the browser.
export async function registerGoogleUser(user: GoogleUser): Promise<void> {
  const baseUrl = process.env.BACKEND_API_URL;
  const apiKey = process.env.BACKEND_API_KEY;
  if (!baseUrl || !apiKey) throw new Error('BACKEND_API_URL or BACKEND_API_KEY missing');

  const response = await fetch(new URL('/api/v1/users/google-sign-in', baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
    body: JSON.stringify(user),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`User registration failed with status ${response.status}`);
}
