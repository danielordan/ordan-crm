import type { InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/Input';

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

// Labelled text field for the Sign In and Sign Up forms
export function AuthField({ id, label, ...props }: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-body font-medium text-text-primary">
        {label}
      </label>
      <Input id={id} name={id} required {...props} />
    </div>
  );
}
