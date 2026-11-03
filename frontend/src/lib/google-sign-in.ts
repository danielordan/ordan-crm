import type { GoogleUser } from './backend-client';

interface GoogleProfile {
  sub?: string | null;
  email?: string | null;
  email_verified?: boolean | null;
  name?: string | null;
}

// Decides whether a Google sign-in may continue. Only users that were registered in the
// backend get a session (PRD 4.1); any failure denies the sign-in.
export async function allowGoogleSignIn(
  profile: GoogleProfile | undefined,
  register: (user: GoogleUser) => Promise<void>,
): Promise<boolean> {
  if (!profile?.sub || !profile.email || profile.email_verified === false) return false;
  try {
    await register({ googleId: profile.sub, email: profile.email, name: profile.name ?? null });
    return true;
  } catch (error) {
    console.error('Google sign-in registration failed', { error: String(error) });
    return false;
  }
}
