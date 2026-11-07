'use client';

import { useActionState } from 'react';
import { AuthField } from '@/components/auth/AuthField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { signInWithPassword, type PasswordFormState } from '@/lib/auth-actions';
import { PASSWORD_MAX_LENGTH } from '@/lib/password-rules';

// Username + password sign-in (PRD 4.1, DESIGN 1.7)
export function PasswordSignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState<PasswordFormState, FormData>(
    signInWithPassword,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <AuthField
        id="username"
        label="Username"
        autoComplete="username"
        maxLength={100}
        defaultValue={state.username}
        aria-invalid={state.error ? true : undefined}
      />
      <AuthField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        maxLength={PASSWORD_MAX_LENGTH}
        aria-invalid={state.error ? true : undefined}
      />
      <Button type="submit" disabled={pending} className="h-11 w-full">
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
