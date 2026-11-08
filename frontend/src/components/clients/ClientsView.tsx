'use client';

import { Plus, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  parseViewState,
  toApiQuery,
  toPageQuery,
  type ClientListResponse,
  type ClientsViewState,
  type StatusFilter,
} from '@/lib/clients-query';
import { SessionExpiredError } from '@/lib/clients-api';
import { cn } from '@/lib/cn';
import { ClientsTable } from './ClientsTable';
import { Pagination } from './Pagination';

export const SEARCH_DELAY_MS = 300;

const STATUS_OPTIONS = [
  { value: '', label: 'All Processing Status' },
  { value: 'Success', label: 'Success' },
  { value: 'Failed', label: 'Failed' },
];

async function fetchClients(query: string, signal: AbortSignal): Promise<ClientListResponse> {
  const response = await fetch(`/api/clients${query}`, { signal, cache: 'no-store' });
  if (response.status === 401) throw new SessionExpiredError();
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  return (await response.json()) as ClientListResponse;
}

// Updates the URL without a server round trip; useSearchParams follows it
function navigate(state: ClientsViewState, replace = false): void {
  const url = `${window.location.pathname}${toPageQuery(state)}`;
  if (replace) window.history.replaceState(null, '', url);
  else window.history.pushState(null, '', url);
}

interface LoadResult {
  key: string;
  data?: ClientListResponse;
  failed?: boolean;
}

// Clients screen (PRD 4.2, DESIGN 1.1): search, filter, sort, paging and refresh
export function ClientsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = useMemo(() => parseViewState(searchParams), [searchParams]);
  const apiQuery = toApiQuery(state);

  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${apiQuery}#${reloadCount}`;
  const [result, setResult] = useState<LoadResult | null>(null);
  const loading = result?.key !== requestKey;

  useEffect(() => {
    const controller = new AbortController();
    fetchClients(apiQuery, controller.signal).then(
      (data) => setResult({ key: requestKey, data }),
      (error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof SessionExpiredError) {
          const back = `${window.location.pathname}${window.location.search}`;
          router.replace(`/sign-in?callbackUrl=${encodeURIComponent(back)}`);
          return;
        }
        setResult({ key: requestKey, failed: true });
      },
    );
    // A newer request replaces this one; its late answer is ignored
    return () => controller.abort();
  }, [apiQuery, requestKey, router]);

  // The search box follows the URL (e.g. after Back) unless it already shows that text
  const [searchInput, setSearchInput] = useState(state.search);
  const [syncedSearch, setSyncedSearch] = useState(state.search);
  if (state.search !== syncedSearch) {
    setSyncedSearch(state.search);
    if (searchInput.trim() !== state.search) setSearchInput(state.search);
  }

  useEffect(() => {
    const search = searchInput.trim();
    if (search === state.search) return;
    const timer = setTimeout(() => navigate({ ...state, search, page: 1 }, true), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchInput, state]);

  const reload = () => setReloadCount((count) => count + 1);
  const failed = !loading && result?.failed;
  const items = result?.data?.items ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h1">Clients</h1>
        <Link
          href="/upload"
          className="inline-flex h-10 items-center gap-2 rounded-control bg-primary px-4 text-body font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:bg-primary-pressed"
        >
          <Plus aria-hidden="true" className="size-4" />
          Upload PDF
        </Link>
      </div>

      <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex gap-4">
          <Input
            type="search"
            aria-label="Search clients"
            placeholder="Search by company, email, phone, country, port..."
            icon={<Search />}
            value={searchInput}
            maxLength={200}
            onChange={(event) => setSearchInput(event.target.value)}
            className="flex-1"
          />
          <Select
            aria-label="Processing Status"
            options={STATUS_OPTIONS}
            value={state.status}
            onChange={(event) =>
              navigate({ ...state, status: event.target.value as StatusFilter, page: 1 })
            }
            className="w-56"
          />
          <Button
            variant="secondary"
            icon={<RefreshCw className={cn(loading && 'animate-spin')} />}
            onClick={reload}
          >
            Refresh
          </Button>
        </div>

        {failed ? (
          <Alert
            variant="error"
            action={
              <Button variant="secondary" onClick={reload}>
                Try Again
              </Button>
            }
          >
            Something went wrong. Please try again.
          </Alert>
        ) : (
          <>
            <div className="overflow-hidden rounded-card border border-border">
              <ClientsTable
                items={items}
                sort={state.sort}
                loading={loading}
                onToggleSort={() =>
                  navigate({ ...state, sort: state.sort === 'desc' ? 'asc' : 'desc', page: 1 })
                }
              />
            </div>
            <Pagination
              hasPrevious={state.page > 1}
              hasNext={!loading && Boolean(result?.data?.hasNextPage)}
              onPrevious={() => navigate({ ...state, page: state.page - 1 })}
              onNext={() => navigate({ ...state, page: state.page + 1 })}
            />
          </>
        )}
      </div>
    </div>
  );
}
