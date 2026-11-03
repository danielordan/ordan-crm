import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';

// Every signed-in page gets the sidebar; Sign In lives outside this group
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
