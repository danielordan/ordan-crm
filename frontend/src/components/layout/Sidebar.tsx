'use client';

import { LogOut, Upload, Users, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOutToSignIn } from '@/lib/auth-actions';
import { cn } from '@/lib/cn';
import { SidebarDecoration } from './SidebarDecoration';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const itemClasses =
  'flex w-full items-center gap-3 rounded-control border-l-2 px-4 py-3 text-body font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary';
const idleClasses = 'border-transparent text-white/75 hover:bg-navy-light/60 hover:text-white';

const NAV_ITEMS: NavItem[] = [
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/upload', label: 'Upload PDF', icon: Upload },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col overflow-hidden bg-navy">
      <div className="px-6 pt-8 pb-8">
        <p className="text-h3 leading-tight font-bold text-white">
          Ordan Cargo
          <br />
          <span className="text-primary">Future Clients</span>
        </p>
      </div>
      <nav aria-label="Main" className="relative z-10 flex flex-col gap-2 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                itemClasses,
                active ? 'border-primary bg-navy-light text-white' : idleClasses,
              )}
            >
              <Icon aria-hidden="true" className={cn('size-5', active && 'text-primary')} />
              {label}
            </Link>
          );
        })}
      </nav>
      {/* Above the decorative shapes at the bottom of the sidebar */}
      <form action={signOutToSignIn} className="relative z-10 mt-auto px-3 pb-44">
        <button type="submit" className={cn(itemClasses, idleClasses, 'cursor-pointer')}>
          <LogOut aria-hidden="true" className="size-5" />
          Sign out
        </button>
      </form>
      <SidebarDecoration />
    </aside>
  );
}
