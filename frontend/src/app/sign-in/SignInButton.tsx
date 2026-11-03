'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { GoogleIcon } from '@/components/ui/GoogleIcon';

// Disabled while the browser is redirecting to Google
export function SignInButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="secondary"
      disabled={pending}
      icon={<GoogleIcon className="size-[18px]" />}
      className="h-11 w-full"
    >
      Sign in with Google
    </Button>
  );
}
