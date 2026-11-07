import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { registerGoogleUser, verifyPasswordUser } from '@/lib/backend-client';
import { allowGoogleSignIn } from '@/lib/google-sign-in';

// Sign in with Google or with username + password (ARCHITECTURE 5.1, 16.1, ADR-18, ADR-37).
// AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are read from the environment by Auth.js.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google,
    Credentials({
      credentials: { username: {}, password: {} },
      // The backend checks the password hash; null means wrong username or password
      authorize: async (credentials) => {
        const { username, password } = credentials;
        if (typeof username !== 'string' || typeof password !== 'string') return null;
        if (!username.trim() || !password) return null;
        const user = await verifyPasswordUser({ username, password });
        return user ? { id: user.id, name: user.username } : null;
      },
    }),
  ],
  // Encrypted JWT cookie; no sessions are stored in the database
  session: { strategy: 'jwt' },
  pages: { signIn: '/sign-in', error: '/sign-in' },
  callbacks: {
    signIn: ({ account, profile }) => {
      if (account?.provider === 'credentials') return true;
      return account?.provider === 'google' && allowGoogleSignIn(profile, registerGoogleUser);
    },
  },
});
