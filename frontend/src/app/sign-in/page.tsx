import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Alert } from '@/components/ui/Alert';
import { safeCallbackUrl, SIGN_UP_PATH } from '@/lib/access';
import { signInWithGoogle } from '@/lib/auth-actions';
import { PasswordSignInForm } from './PasswordSignInForm';
import { SignInButton } from './SignInButton';

export const metadata: Metadata = { title: 'Sign In — Ordan Cargo Future Clients' };

interface SignInPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Sign In (DESIGN 1.7): available without a session, shown without the sidebar
export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  const failed = params.error !== undefined;

  return (
    <AuthLayout>
      {failed ? <Alert variant="error">Sign in failed. Please try again.</Alert> : null}
      <PasswordSignInForm callbackUrl={callbackUrl} />
      <div className="flex items-center gap-3 text-body-sm text-text-secondary">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <form action={signInWithGoogle.bind(null, callbackUrl)}>
        <SignInButton />
      </form>
      <p className="text-center text-body text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link
          href={SIGN_UP_PATH}
          className="font-medium text-primary-pressed hover:underline focus-visible:outline-2 focus-visible:outline-primary"
        >
          Create account
        </Link>
      </p>
    </AuthLayout>
  );
}
