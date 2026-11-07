import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { SIGN_IN_PATH } from '@/lib/access';
import { SignUpForm } from './SignUpForm';

export const metadata: Metadata = { title: 'Create Account — Ordan Cargo Future Clients' };

// Sign Up (DESIGN 1.8): available without a session, shown without the sidebar
export default function SignUpPage() {
  return (
    <AuthLayout>
      <p className="-mt-2 text-center text-subtitle text-text-secondary">Create your account</p>
      <SignUpForm />
      <p className="text-center text-body text-text-secondary">
        Already have an account?{' '}
        <Link
          href={SIGN_IN_PATH}
          className="font-medium text-primary-pressed hover:underline focus-visible:outline-2 focus-visible:outline-primary"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
