import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { registerGoogleUser } from '@/lib/backend-client';
import { allowGoogleSignIn } from '@/lib/google-sign-in';

// Sign in with Google (ARCHITECTURE 5.1, 16.1, ADR-18). AUTH_SECRET, AUTH_GOOGLE_ID and
// AUTH_GOOGLE_SECRET are read from the environment by Auth.js.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  // Encrypted JWT cookie; no sessions are stored in the database
  session: { strategy: 'jwt' },
  pages: { signIn: '/sign-in', error: '/sign-in' },
  callbacks: {
    signIn: ({ account, profile }) =>
      account?.provider === 'google' && allowGoogleSignIn(profile, registerGoogleUser),
  },
});
