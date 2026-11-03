import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { fieldClasses } from './field-styles';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export function Input({ icon, className, ...props }: InputProps) {
  return (
    <div className={cn('relative', className)}>
      {icon ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 flex size-4 -translate-y-1/2 items-center text-text-secondary"
        >
          {icon}
        </span>
      ) : null}
      <input className={cn(fieldClasses, icon ? 'pr-3 pl-9' : 'px-3')} {...props} />
    </div>
  );
}
