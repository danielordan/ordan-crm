'use client';

import { ERROR_TITLE, ErrorContent } from '@/components/ui/ErrorContent';

// Unexpected error on a signed-in page: shown inside the app shell, with the sidebar
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <title>{ERROR_TITLE}</title>
      <ErrorContent onRetry={reset} className="min-h-[calc(100vh-4rem)]" />
    </>
  );
}
