import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ClientListItem } from '@/lib/clients-query';
import { ClientsView } from './ClientsView';

// useSearchParams follows window.history like the real Next.js router does
const urlStore = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    notify: () => listeners.forEach((listener) => listener()),
  };
});

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));

vi.mock('next/navigation', async () => {
  const React = await import('react');
  return {
    useRouter: () => router,
    useSearchParams: () => {
      const search = React.useSyncExternalStore(urlStore.subscribe, () => window.location.search);
      return React.useMemo(() => new URLSearchParams(search), [search]);
    },
  };
});

const client = (fields: Partial<ClientListItem>): ClientListItem => ({
  id: 'id-1',
  companyName: 'Blue Ocean Imports',
  email: 'info@blueocean.co.il',
  phone: '+972 3 555 1234',
  dateAdded: '2026-07-20T11:32:00.000Z',
  processingStatus: 'Success',
  ...fields,
});

const fetchMock = vi.fn<typeof fetch>();

function respond(items: ClientListItem[], hasNextPage = false) {
  fetchMock.mockImplementation(() =>
    Promise.resolve(Response.json({ items, page: 1, limit: 25, hasNextPage })),
  );
}

const lastQuery = () => String(fetchMock.mock.calls.at(-1)?.[0]);

describe('ClientsView', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/clients');
    for (const method of ['pushState', 'replaceState'] as const) {
      const original = History.prototype[method];
      vi.spyOn(window.history, method).mockImplementation(function (
        this: History,
        ...args: Parameters<History['pushState']>
      ) {
        original.apply(this, args);
        urlStore.notify();
      });
    }
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows clients with badges, dates and NOT Available for missing values', async () => {
    respond([
      client({}),
      client({
        id: 'id-2',
        companyName: null,
        email: null,
        phone: null,
        processingStatus: 'Failed',
      }),
    ]);
    render(<ClientsView />);

    expect(await screen.findByText('Blue Ocean Imports')).toBeInTheDocument();
    expect(screen.getAllByText('Jul 20, 2026', { selector: 'td' })).toHaveLength(2);
    expect(screen.getByText('Success', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Failed', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getAllByText('NOT Available')).toHaveLength(3);
    expect(screen.getAllByRole('link', { name: 'View' })[0]).toHaveAttribute(
      'href',
      '/clients/id-1',
    );
    expect(lastQuery()).toBe('/api/clients?sortOrder=desc&page=1');
  });

  it('shows the empty state', async () => {
    respond([]);
    render(<ClientsView />);
    expect(await screen.findByText('No clients found.')).toBeInTheDocument();
  });

  it('shows an error with Try Again, which loads again', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 502 }));
    render(<ClientsView />);
    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();

    respond([client({})]);
    await userEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(await screen.findByText('Blue Ocean Imports')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('toggles the Date Added sort direction', async () => {
    respond([client({})]);
    render(<ClientsView />);
    const header = await screen.findByRole('columnheader', { name: /Date Added/ });
    expect(header).toHaveAttribute('aria-sort', 'descending');

    await userEvent.click(within(header).getByRole('button'));
    await waitFor(() => expect(lastQuery()).toBe('/api/clients?sortOrder=asc&page=1'));
    expect(header).toHaveAttribute('aria-sort', 'ascending');
  });

  it('pages with Previous and Next, disabled at the edges', async () => {
    respond([client({})], true);
    render(<ClientsView />);
    const next = await screen.findByRole('button', { name: 'Next' });
    await waitFor(() => expect(next).toBeEnabled());
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    respond([client({})], false);
    await userEvent.click(next);
    await waitFor(() => expect(lastQuery()).toBe('/api/clients?sortOrder=desc&page=2'));
    expect(window.location.search).toBe('?page=2');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled());
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('reloads the same page with Refresh', async () => {
    respond([client({})]);
    render(<ClientsView />);
    await screen.findByText('Blue Ocean Imports');
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(lastQuery()).toBe('/api/clients?sortOrder=desc&page=1');
  });

  it('searches after typing stops, from page 1', async () => {
    window.history.replaceState(null, '', '/clients?page=3');
    respond([client({})]);
    render(<ClientsView />);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search clients' }), '03-555');

    await waitFor(() =>
      expect(lastQuery()).toBe('/api/clients?search=03-555&sortOrder=desc&page=1'),
    );
    expect(fetchMock.mock.calls.map(([url]) => String(url))).not.toContain(
      '/api/clients?search=03&sortOrder=desc&page=1',
    );
  });

  it('goes to Sign In when the session has expired', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: 'UNAUTHORIZED' }, { status: 401 }));
    render(<ClientsView />);
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/sign-in?callbackUrl=%2Fclients'),
    );
  });

  it('filters by processing status', async () => {
    respond([client({})]);
    render(<ClientsView />);
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Processing Status' }),
      'Failed',
    );
    await waitFor(() =>
      expect(lastQuery()).toBe('/api/clients?processingStatus=Failed&sortOrder=desc&page=1'),
    );
  });
});
