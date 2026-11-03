'use server';

import { signIn, signOut } from '@/auth';
import { safeCallbackUrl, SIGN_IN_PATH } from './access';

export async function signInWithGoogle(callbackUrl: string): Promise<void> {
  await signIn('google', { redirectTo: safeCallbackUrl(callbackUrl) });
}

export async function signOutToSignIn(): Promise<void> {
  await signOut({ redirectTo: SIGN_IN_PATH });
}
