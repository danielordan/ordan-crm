import { TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export const ERROR_TITLE = 'Error — Ordan Cargo Future Clients';

// Shared "something went wrong" content (DESIGN 1.10), same card as the 404 page
export function ErrorContent({ onRetry, className }: { onRetry: () => void; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <section className="flex w-full max-w-md flex-col items-center gap-4 rounded-card border border-border bg-surface p-8 text-center shadow-card">
        <span className="flex size-14 items-center justify-center rounded-full bg-error-light">
          <TriangleAlert aria-hidden="true" className="size-7 text-error" />
        </span>
        <h1 className="text-h2 text-navy">Something went wrong</h1>
        <p className="text-body-lg text-text-secondary">
          An unexpected error occurred. Please try again.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onRetry}>Try Again</Button>
          <Link
            href="/clients"
            className="inline-flex h-10 items-center justify-center rounded-control border border-border bg-surface px-4 text-body font-medium text-navy transition-colors hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:bg-accent"
          >
            Back to Clients
          </Link>
        </div>
      </section>
    </div>
  );
}
