'use client';

import { ERROR_TITLE, ErrorContent } from '@/components/ui/ErrorContent';

// Unexpected error outside the app group (Sign In, Create Account); shown without the sidebar
export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="bg-background p-8">
      <title>{ERROR_TITLE}</title>
      <ErrorContent onRetry={reset} className="min-h-[calc(100vh-4rem)]" />
    </main>
  );
}
