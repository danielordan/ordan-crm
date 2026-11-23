import type { Metadata } from 'next';
import { NOT_FOUND_TITLE, NotFoundContent } from '@/components/ui/NotFoundContent';

export const metadata: Metadata = { title: NOT_FOUND_TITLE };

// Shown inside the app shell, with the sidebar
export default function AppNotFound() {
  return <NotFoundContent className="min-h-[calc(100vh-4rem)]" />;
}
