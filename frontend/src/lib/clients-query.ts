import type { ProcessingStatus } from '@/components/ui/StatusBadge';

// State of the Clients screen, kept in the page URL so Back and Refresh keep the same view

export type StatusFilter = '' | ProcessingStatus;
export type SortOrder = 'desc' | 'asc';

export interface ClientsViewState {
  search: string;
  status: StatusFilter;
  sort: SortOrder;
  page: number;
}

export const DEFAULT_VIEW: ClientsViewState = { search: '', status: '', sort: 'desc', page: 1 };

interface ParamsLike {
  get(name: string): string | null;
}

// Invalid values in a hand-edited URL fall back to the defaults
export function parseViewState(params: ParamsLike): ClientsViewState {
  const status = params.get('status');
  const page = Number(params.get('page'));
  return {
    search: (params.get('search') ?? '').trim().slice(0, 200),
    status: status === 'Success' || status === 'Failed' ? status : '',
    sort: params.get('sort') === 'asc' ? 'asc' : 'desc',
    page: Number.isInteger(page) && page >= 1 && page <= 10_000 ? page : 1,
  };
}

// Page URL query; defaults are left out to keep it short
export function toPageQuery(state: ClientsViewState): string {
  const params = new URLSearchParams();
  if (state.search) params.set('search', state.search);
  if (state.status) params.set('status', state.status);
  if (state.sort !== 'desc') params.set('sort', state.sort);
  if (state.page !== 1) params.set('page', String(state.page));
  const query = params.toString();
  return query ? `?${query}` : '';
}

// Query for GET /api/clients (ARCHITECTURE 12.1)
export function toApiQuery(state: ClientsViewState): string {
  const params = new URLSearchParams();
  if (state.search) params.set('search', state.search);
  if (state.status) params.set('processingStatus', state.status);
  params.set('sortOrder', state.sort);
  params.set('page', String(state.page));
  return `?${params.toString()}`;
}

export interface ClientListItem {
  id: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  dateAdded: string;
  processingStatus: ProcessingStatus;
}

export interface ClientListResponse {
  items: ClientListItem[];
  page: number;
  limit: number;
  hasNextPage: boolean;
}
