import type { GoogleUser } from './backend-client';

interface GoogleProfile {
  sub?: string | null;
  email?: string | null;
  email_verified?: boolean | null;
  name?: string | null;
}

// Registers a Google sign-in in the backend and returns the user's internal ID. Only users
// that were registered get a session (PRD 4.1); any failure returns null and denies the sign-in.
export async function registerGoogleSignIn(
  profile: GoogleProfile | undefined,
  register: (user: GoogleUser) => Promise<{ id: string }>,
): Promise<string | null> {
  if (!profile?.sub || !profile.email || profile.email_verified === false) return null;
  try {
    const user = await register({
      googleId: profile.sub,
      email: profile.email,
      name: profile.name ?? null,
    });
    return user.id;
  } catch (error) {
    console.error('Google sign-in registration failed', { error: String(error) });
    return null;
  }
}
