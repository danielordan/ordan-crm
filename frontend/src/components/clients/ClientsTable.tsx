'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ClientListItem, SortOrder } from '@/lib/clients-query';
import { cn } from '@/lib/cn';
import { formatTableDate, isMissing, NOT_AVAILABLE } from '@/lib/format';

interface ClientsTableProps {
  items: ClientListItem[] | null;
  sort: SortOrder;
  onToggleSort: () => void;
  loading: boolean;
}

const COLUMN_COUNT = 6;
const SKELETON_ROWS = 8;

function TextCell({ value, className }: { value: string | null; className?: string }) {
  if (isMissing(value)) {
    return <td className={cn('px-4 py-3 text-text-secondary', className)}>{NOT_AVAILABLE}</td>;
  }
  return (
    <td className={cn('max-w-0 truncate px-4 py-3', className)} title={value ?? undefined}>
      {value}
    </td>
  );
}

// Clients table (DESIGN 1.1, 2.6). Without data yet, skeleton rows are shown.
export function ClientsTable({ items, sort, onToggleSort, loading }: ClientsTableProps) {
  const router = useRouter();
  const SortIcon = sort === 'desc' ? ArrowDown : ArrowUp;

  return (
    <table
      aria-busy={loading}
      className={cn(
        'w-full table-fixed border-collapse text-left text-body transition-opacity',
        loading && items && 'opacity-60',
      )}
    >
      <thead className="bg-background text-body-sm font-medium text-text-secondary">
        <tr className="border-b border-border">
          <th scope="col" className="w-[22%] px-4 py-3 font-medium">
            Company Name
          </th>
          <th scope="col" className="w-[24%] px-4 py-3 font-medium">
            Email
          </th>
          <th scope="col" className="w-[16%] px-4 py-3 font-medium">
            Phone
          </th>
          <th
            scope="col"
            aria-sort={sort === 'desc' ? 'descending' : 'ascending'}
            className="w-[14%] px-4 py-3 font-medium"
          >
            <button
              type="button"
              onClick={onToggleSort}
              className="inline-flex cursor-pointer items-center gap-1 rounded-control hover:text-text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              Date Added
              <SortIcon aria-hidden="true" className="size-3.5" />
            </button>
          </th>
          <th scope="col" className="w-[14%] px-4 py-3 font-medium">
            Processing Status
          </th>
          <th scope="col" className="w-[10%] px-4 py-3 font-medium">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {items === null
          ? Array.from({ length: SKELETON_ROWS }, (_, row) => (
              <tr key={row} className="border-b border-border last:border-0">
                {Array.from({ length: COLUMN_COUNT }, (_, col) => (
                  <td key={col} className="px-4 py-4">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-border" />
                  </td>
                ))}
              </tr>
            ))
          : null}

        {items?.length === 0 ? (
          <tr>
            <td colSpan={COLUMN_COUNT} className="px-4 py-12 text-center text-text-secondary">
              No clients found.
            </td>
          </tr>
        ) : null}

        {items?.map((client) => {
          const href = `/clients/${client.id}`;
          return (
            <tr
              key={client.id}
              onClick={() => router.push(href)}
              className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-primary-light/50"
            >
              <TextCell value={client.companyName} className="font-medium" />
              <TextCell value={client.email} />
              <TextCell value={client.phone} />
              <td className="px-4 py-3 whitespace-nowrap">{formatTableDate(client.dateAdded)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={client.processingStatus} />
              </td>
              <td className="px-4 py-3">
                <Link
                  href={href}
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex h-8 items-center rounded-control border border-border bg-surface px-3 text-body-sm font-medium text-navy transition-colors hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  View
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
