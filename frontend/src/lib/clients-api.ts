import type { Client, ClientFields } from './client-details';

export class SessionExpiredError extends Error {}
export class ClientNotFoundError extends Error {}
export class DuplicateClientError extends Error {}

// Turns an error status into an error the screens handle
function assertOk(response: Response): void {
  if (response.ok) return;
  if (response.status === 401) throw new SessionExpiredError();
  if (response.status === 404) throw new ClientNotFoundError();
  if (response.status === 409) throw new DuplicateClientError();
  throw new Error(`Request failed with status ${response.status}`);
}

export async function fetchClient(id: string, signal: AbortSignal): Promise<Client> {
  const response = await fetch(`/api/clients/${id}`, { signal, cache: 'no-store' });
  // When loading, the ID from the URL is the only input, so 400 means a malformed ID
  if (response.status === 400) throw new ClientNotFoundError();
  assertOk(response);
  return (await response.json()) as Client;
}

export async function updateClient(id: string, fields: ClientFields): Promise<Client> {
  const response = await fetch(`/api/clients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  assertOk(response);
  return (await response.json()) as Client;
}

export async function deleteClient(id: string): Promise<void> {
  assertOk(await fetch(`/api/clients/${id}`, { method: 'DELETE' }));
}
