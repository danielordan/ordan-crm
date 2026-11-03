import type { Metadata } from 'next';
import { Alert } from '@/components/ui/Alert';
import { safeCallbackUrl } from '@/lib/access';
import { signInWithGoogle } from '@/lib/auth-actions';
import { SignInButton } from './SignInButton';

export const metadata: Metadata = { title: 'Sign In — Ordan Cargo Future Clients' };

interface SignInPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Sign In (DESIGN 1.7): the only page available without a session, shown without the sidebar
export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  const failed = params.error !== undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-8">
      <section className="flex w-full max-w-sm flex-col gap-8 rounded-card border border-border bg-surface p-8 shadow-card">
        <h1 className="text-center text-h2 leading-tight font-bold text-navy">
          Ordan Cargo
          <br />
          <span className="text-primary">Future Clients</span>
        </h1>
        <div className="flex flex-col gap-4">
          {failed ? <Alert variant="error">Sign in failed. Please try again.</Alert> : null}
          <form action={signInWithGoogle.bind(null, callbackUrl)}>
            <SignInButton />
          </form>
        </div>
      </section>
    </main>
  );
}
