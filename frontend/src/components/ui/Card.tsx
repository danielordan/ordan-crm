import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
}

export function Card({ title, className, children, ...props }: CardProps) {
  return (
    <section
      className={cn('rounded-card border border-border bg-surface p-6 shadow-card', className)}
      {...props}
    >
      {title ? <h2 className="mb-4 text-h3 text-text-primary">{title}</h2> : null}
      {children}
    </section>
  );
}
