'use server';

import { AuthError } from 'next-auth';
import { signIn, signOut } from '@/auth';
import { safeCallbackUrl, SIGN_IN_PATH } from './access';
import { registerPasswordUser } from './backend-client';
import { validateSignUp } from './password-rules';

// Result of a username + password form; `username` is kept so the field is not cleared
export interface PasswordFormState {
  error?: string;
  username?: string;
}

const SIGN_IN_FAILED = 'Sign in failed. Please try again.';

export async function signInWithGoogle(callbackUrl: string): Promise<void> {
  await signIn('google', { redirectTo: safeCallbackUrl(callbackUrl) });
}

// Signs in with username + password. On success Auth.js redirects (throws NEXT_REDIRECT).
async function signInWithCredentials(
  username: string,
  password: string,
  callbackUrl: string,
): Promise<PasswordFormState> {
  try {
    await signIn('credentials', { username, password, redirectTo: safeCallbackUrl(callbackUrl) });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        username,
        error: error.type === 'CredentialsSignin' ? 'Wrong username or password.' : SIGN_IN_FAILED,
      };
    }
    throw error;
  }
  return { username };
}

export async function signInWithPassword(
  _previous: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!username || !password) return { username, error: 'Enter your username and password.' };
  return signInWithCredentials(username, password, String(formData.get('callbackUrl') ?? ''));
}

export async function signUpWithPassword(
  _previous: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirmPassword') ?? '');

  const problem = validateSignUp(username, password, confirm);
  if (problem) return { username, error: problem };

  try {
    const result = await registerPasswordUser({ username, password });
    if (result === 'taken') return { username, error: 'This username is already taken.' };
  } catch (error) {
    console.error('Sign up failed', { error: String(error) });
    return { username, error: 'Could not create the account. Please try again.' };
  }
  // The new account goes straight into the system
  return signInWithCredentials(username, password, '');
}

export async function signOutToSignIn(): Promise<void> {
  await signOut({ redirectTo: SIGN_IN_PATH });
}
