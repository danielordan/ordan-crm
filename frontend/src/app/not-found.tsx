import type { Metadata } from 'next';
import { NOT_FOUND_TITLE, NotFoundContent } from '@/components/ui/NotFoundContent';

export const metadata: Metadata = { title: NOT_FOUND_TITLE };

// Fallback for notFound() outside the app group; shown without the sidebar
export default function RootNotFound() {
  return (
    <main className="bg-background p-8">
      <NotFoundContent className="min-h-[calc(100vh-4rem)]" />
    </main>
  );
}
