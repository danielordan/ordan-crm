import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'destructive-outline';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover active:bg-primary-pressed disabled:bg-border disabled:text-text-secondary',
  secondary:
    'border border-border bg-surface text-navy hover:bg-primary-light active:bg-accent disabled:text-text-secondary',
  destructive:
    'bg-error text-white hover:bg-error-hover active:bg-error-pressed disabled:bg-border disabled:text-text-secondary',
  'destructive-outline':
    'border border-error/40 bg-surface text-error-text hover:bg-error-light active:bg-error/15 disabled:border-border disabled:text-text-secondary',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  icon,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-control px-4 text-body font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'cursor-pointer disabled:cursor-not-allowed',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {icon ? (
        <span aria-hidden="true" className="flex size-4 items-center">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}
