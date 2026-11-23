'use server';

import { unstable_rethrow } from 'next/navigation';
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

// Wrong credentials are recognised by `type` too, in case the bundle holds two copies of AuthError
function isWrongCredentials(error: unknown): boolean {
  if (error instanceof AuthError) return error.type === 'CredentialsSignin';
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { type?: unknown }).type === 'CredentialsSignin'
  );
}

// Signs in with username + password. On success Auth.js redirects (throws NEXT_REDIRECT).
// Any other failure becomes a message on the form, never an error page (Milestone 10).
async function signInWithCredentials(
  username: string,
  password: string,
  callbackUrl: string,
): Promise<PasswordFormState> {
  try {
    await signIn('credentials', { username, password, redirectTo: safeCallbackUrl(callbackUrl) });
  } catch (error) {
    // The success redirect is thrown as an error and must reach Next.js
    unstable_rethrow(error);
    if (isWrongCredentials(error)) return { username, error: 'Wrong username or password.' };
    // Only the error type is logged: no username or password
    console.error('Password sign-in failed', {
      type:
        error instanceof AuthError ? error.type : error instanceof Error ? error.name : 'unknown',
    });
    return { username, error: SIGN_IN_FAILED };
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
