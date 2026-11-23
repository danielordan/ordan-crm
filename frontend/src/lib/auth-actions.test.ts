import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { signInWithPassword, signUpWithPassword } from './auth-actions';
import { registerPasswordUser } from './backend-client';

// Minimal stand-in for Auth.js errors; the real package needs the Next.js server runtime
vi.mock('next-auth', () => ({
  AuthError: class AuthError extends Error {
    type: string;
    constructor(type: string) {
      super(type);
      this.type = type;
    }
  },
}));
vi.mock('@/auth', () => ({ signIn: vi.fn(), signOut: vi.fn() }));
vi.mock('./backend-client', () => ({ registerPasswordUser: vi.fn() }));

const { AuthError } = (await import('next-auth')) as unknown as {
  AuthError: new (type: string) => Error;
};
const mockSignIn = vi.mocked(signIn);

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
const signInForm = form({ username: 'noa', password: 'wrong-pass', callbackUrl: '/clients' });

function redirectError(): unknown {
  try {
    redirect('/clients');
  } catch (error) {
    return error;
  }
}

describe('signInWithPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('asks for both fields when one is empty', async () => {
    const result = await signInWithPassword({}, form({ username: 'noa', password: '' }));
    expect(result).toEqual({ username: 'noa', error: 'Enter your username and password.' });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('shows the wrong credentials message and keeps the username', async () => {
    mockSignIn.mockRejectedValue(new AuthError('CredentialsSignin'));
    expect(await signInWithPassword({}, signInForm)).toEqual({
      username: 'noa',
      error: 'Wrong username or password.',
    });
  });

  it('recognises wrong credentials from another copy of the error class', async () => {
    mockSignIn.mockRejectedValue(Object.assign(new Error('x'), { type: 'CredentialsSignin' }));
    expect((await signInWithPassword({}, signInForm)).error).toBe('Wrong username or password.');
  });

  it.each([
    ['another Auth.js error', () => new AuthError('CallbackRouteError')],
    ['a timeout', () => Object.assign(new Error('timeout'), { name: 'TimeoutError' })],
    ['a non-Error value', () => 'boom'],
  ])('shows the technical failure message for %s', async (_name, makeError) => {
    mockSignIn.mockRejectedValue(makeError());
    expect(await signInWithPassword({}, signInForm)).toEqual({
      username: 'noa',
      error: 'Sign in failed. Please try again.',
    });
  });

  it('does not log the password', async () => {
    mockSignIn.mockRejectedValue(new Error('down'));
    await signInWithPassword({}, signInForm);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('wrong-pass');
  });

  it('lets the success redirect through', async () => {
    const error = redirectError();
    mockSignIn.mockRejectedValue(error);
    await expect(signInWithPassword({}, signInForm)).rejects.toBe(error);
  });
});

describe('signUpWithPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('shows a message when the automatic sign-in after sign-up fails', async () => {
    vi.mocked(registerPasswordUser).mockResolvedValue('created');
    mockSignIn.mockRejectedValue(new Error('down'));
    const result = await signUpWithPassword(
      {},
      form({ username: 'noa', password: 'secret123', confirmPassword: 'secret123' }),
    );
    expect(result).toEqual({ username: 'noa', error: 'Sign in failed. Please try again.' });
  });
});
