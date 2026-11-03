import { cn } from '@/lib/cn';

export type ProcessingStatus = 'Success' | 'Failed';

const statusClasses: Record<ProcessingStatus, string> = {
  Success: 'bg-success-light text-success-text',
  Failed: 'bg-error-light text-error-text',
};

export function StatusBadge({ status }: { status: ProcessingStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-body-sm font-medium',
        statusClasses[status],
      )}
    >
      {status}
    </span>
  );
}
