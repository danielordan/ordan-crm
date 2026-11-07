import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { registerGoogleUser, verifyPasswordUser } from '@/lib/backend-client';
import { registerGoogleSignIn } from '@/lib/google-sign-in';

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
    signIn: async ({ user, account, profile }) => {
      if (account?.provider === 'credentials') return true;
      if (account?.provider !== 'google') return false;
      const userId = await registerGoogleSignIn(profile, registerGoogleUser);
      if (!userId) return false;
      // Replace Google's ID with the internal one, so the session carries the `users.id`
      // (without a database adapter Auth.js passes this same object on to the jwt callback)
      user.id = userId;
      return true;
    },
    // The internal user ID is kept in the session and sent to the backend for logs (ADR-38)
    jwt: ({ token, user }) => {
      if (user?.id) token.userId = user.id;
      return token;
    },
    session: ({ session, token }) => {
      if (typeof token.userId === 'string') session.user.id = token.userId;
      return session;
    },
  },
});
