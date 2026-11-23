import { FileQuestion } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

// Shared "page not found" content (DESIGN 1.9): unknown URLs and missing clients look the same
export function NotFoundContent({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <section className="flex w-full max-w-md flex-col items-center gap-4 rounded-card border border-border bg-surface p-8 text-center shadow-card">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-light">
          <FileQuestion aria-hidden="true" className="size-7 text-primary" />
        </span>
        <p className="text-h1 text-primary">404</p>
        <h1 className="text-h2 text-navy">Page not found</h1>
        <p className="text-body-lg text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or may have been deleted.
        </p>
        <Link
          href="/clients"
          className="mt-2 inline-flex h-10 items-center justify-center rounded-control bg-primary px-4 text-body font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:bg-primary-pressed"
        >
          Back to Clients
        </Link>
      </section>
    </div>
  );
}

export const NOT_FOUND_TITLE = 'Page Not Found — Ordan Cargo Future Clients';
