'use client';

import { useActionState } from 'react';
import { AuthField } from '@/components/auth/AuthField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { signUpWithPassword, type PasswordFormState } from '@/lib/auth-actions';
import { PASSWORD_MAX_LENGTH, USERNAME_MAX_LENGTH } from '@/lib/password-rules';

// Create account with username + password (PRD 4.1, DESIGN 1.8)
export function SignUpForm() {
  const [state, action, pending] = useActionState<PasswordFormState, FormData>(
    signUpWithPassword,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      <AuthField
        id="username"
        label="Username"
        autoComplete="username"
        maxLength={USERNAME_MAX_LENGTH}
        defaultValue={state.username}
        aria-describedby="username-hint"
      />
      <p id="username-hint" className="-mt-2 text-body-sm text-text-secondary">
        3–30 characters: English letters, digits, dot, underscore or hyphen.
      </p>
      <AuthField
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        maxLength={PASSWORD_MAX_LENGTH}
        aria-describedby="password-hint"
      />
      <p id="password-hint" className="-mt-2 text-body-sm text-text-secondary">
        At least 8 characters.
      </p>
      <AuthField
        id="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        maxLength={PASSWORD_MAX_LENGTH}
      />
      <Button type="submit" disabled={pending} className="h-11 w-full">
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
