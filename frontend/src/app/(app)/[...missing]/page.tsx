import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NOT_FOUND_TITLE } from '@/components/ui/NotFoundContent';

// Without this, the tab title falls back to the layout's title after the page loads
export const metadata: Metadata = { title: NOT_FOUND_TITLE };

// Catches any unknown URL so its 404 is rendered inside the app shell.
// Defined routes (/clients, /upload, /sign-in, /api/...) take priority over this one.
export default function MissingPage() {
  notFound();
}
