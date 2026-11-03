import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type AlertVariant = 'success' | 'info' | 'warning' | 'error';

const variants: Record<AlertVariant, { icon: LucideIcon; box: string; iconClass: string }> = {
  success: {
    icon: CircleCheck,
    box: 'border-success/30 bg-success-light',
    iconClass: 'text-success',
  },
  info: { icon: Info, box: 'border-info/30 bg-info-light', iconClass: 'text-info' },
  warning: {
    icon: TriangleAlert,
    box: 'border-warning/30 bg-warning-light',
    iconClass: 'text-warning',
  },
  error: { icon: CircleAlert, box: 'border-error/30 bg-error-light', iconClass: 'text-error' },
};

interface AlertProps {
  variant: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Alert({ variant, title, children, action, className }: AlertProps) {
  const { icon: Icon, box, iconClass } = variants[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-card border p-4', box, className)}
    >
      <Icon aria-hidden="true" className={cn('mt-0.5 size-5 shrink-0', iconClass)} />
      <div className="flex flex-col gap-1">
        {title ? <p className="text-subtitle text-text-primary">{title}</p> : null}
        {children ? <div className="text-body text-text-primary">{children}</div> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}
