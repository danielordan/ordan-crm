'use client';

import { Inter } from 'next/font/google';
import { ERROR_TITLE, ErrorContent } from '@/components/ui/ErrorContent';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Last resort when the root layout itself fails; it replaces the layout, so it has its own <html>
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en" dir="ltr" className={inter.variable}>
      <body>
        <title>{ERROR_TITLE}</title>
        <main className="bg-background p-8">
          <ErrorContent onRetry={reset} className="min-h-[calc(100vh-4rem)]" />
        </main>
      </body>
    </html>
  );
}
