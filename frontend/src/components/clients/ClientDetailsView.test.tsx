import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Client } from '@/lib/client-details';
import { ClientDetailsView } from './ClientDetailsView';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const ID = '00000000-0000-4000-8000-000000000001';

const failedClient: Client = {
  id: ID,
  companyName: 'Blue Ocean Imports',
  address: null,
  phone: '+972 3 555 1234',
  email: null,
  originPort: 'Shanghai',
  originCountry: 'China',
  destinationPort: 'Haifa',
  incoterms: 'FOB',
  shipmentType: 'FCL',
  dateAdded: '2026-07-20T11:32:00.000Z',
  processingStatus: 'Failed',
  errorDetails: 'Missing required fields: Email.',
};

const successClient: Client = {
  ...failedClient,
  email: 'info@blueocean.co.il',
  processingStatus: 'Success',
  errorDetails: null,
};

const fetchMock = vi.fn<typeof fetch>();

const jsonResponse = (body: object, status = 200) => Response.json(body, { status });

// Answers the first load, then each later request in order
function respond(client: Client, ...later: Response[]) {
  fetchMock.mockResolvedValueOnce(jsonResponse(client));
  for (const response of later) fetchMock.mockResolvedValueOnce(response);
}

const renderView = async () => {
  render(<ClientDetailsView id={ID} />);
  await screen.findByText('Blue Ocean Imports');
};

const requests = () =>
  fetchMock.mock.calls.map(([url, init]) => ({ url: String(url), method: init?.method ?? 'GET' }));

const clickButton = (name: string) => userEvent.click(screen.getByRole('button', { name }));

describe('ClientDetailsView', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    router.replace.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens in edit mode when arriving to fix a record, and Cancel returns to viewing', async () => {
    respond(failedClient);
    render(<ClientDetailsView id={ID} startInEdit />);

    expect(await screen.findByDisplayValue('Blue Ocean Imports')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByText('Blue Ocean Imports')).toBeInTheDocument();
  });

  describe('viewing', () => {
    it('shows every field in order, with NOT Available for missing values', async () => {
      respond(failedClient);
      await renderView();

      const labels = screen.getAllByRole('term').map((term) => term.textContent);
      expect(labels).toEqual([
        'Company Name',
        'Address',
        'Phone',
        'Email',
        'Origin Port',
        'Origin Country',
        'Destination Port',
        'Incoterms',
        'Shipment Type',
        'Date Added',
        'Processing Status',
      ]);
      expect(screen.getAllByText('NOT Available')).toHaveLength(2);
      expect(screen.getByRole('heading', { name: 'Shipment Details' })).toBeInTheDocument();
      expect(screen.getByText('Jul 20, 2026 14:32')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Back to Clients' })).toHaveAttribute(
        'href',
        '/clients',
      );
      expect(requests()).toEqual([{ url: `/api/clients/${ID}`, method: 'GET' }]);
    });

    it('shows Error Details only when the status is Failed', async () => {
      respond(failedClient);
      const { unmount } = render(<ClientDetailsView id={ID} />);
      expect(await screen.findByText('Error Details')).toBeInTheDocument();
      expect(screen.getByText('Missing required fields: Email.')).toBeInTheDocument();
      unmount();

      respond(successClient);
      await renderView();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.queryByText('Error Details')).not.toBeInTheDocument();
    });

    it('shows Client not found for a missing client', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'NOT_FOUND' }, 404));
      render(<ClientDetailsView id={ID} />);
      expect(await screen.findByText('Client not found.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Back to Clients' })).toBeInTheDocument();
    });

    it('shows Client not found for an invalid ID', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'BAD_REQUEST' }, 400));
      render(<ClientDetailsView id="abc" />);
      expect(await screen.findByText('Client not found.')).toBeInTheDocument();
    });

    it('offers Try Again after a failed load', async () => {
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 502 }));
      render(<ClientDetailsView id={ID} />);
      expect(
        await screen.findByText('Something went wrong. Please try again.'),
      ).toBeInTheDocument();

      respond(successClient);
      await clickButton('Try Again');
      expect(await screen.findByText('Blue Ocean Imports')).toBeInTheDocument();
    });

    it('sends an expired session to Sign In', async () => {
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
      render(<ClientDetailsView id={ID} />);
      await waitFor(() =>
        expect(router.replace).toHaveBeenCalledWith(expect.stringMatching(/^\/sign-in\?callback/)),
      );
    });
  });

  describe('editing', () => {
    it('does not reuse the Edit button element as the Save button', async () => {
      // A browser would treat the click on Edit as a click on Save and submit the form at once.
      // jsdom does not reproduce that, so the cause itself is checked.
      respond(failedClient);
      await renderView();
      const editButton = screen.getByRole('button', { name: 'Edit' });
      await userEvent.click(editButton);

      expect(screen.getByRole('button', { name: 'Save' })).not.toBe(editButton);
      expect(editButton).not.toBeInTheDocument();
    });

    it('swaps the buttons and fills the inputs, with missing values empty', async () => {
      respond(failedClient);
      await renderView();
      await clickButton('Edit');

      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
      expect(screen.getByLabelText('Company Name')).toHaveValue('Blue Ocean Imports');
      expect(screen.getByLabelText('Email')).toHaveValue('');
      const options = within(screen.getByLabelText('Shipment Type')).getAllByRole('option');
      expect(options.map((option) => option.textContent)).toEqual(['NOT Available', 'FCL', 'LCL']);
    });

    it('saves all fields and shows the recalculated status', async () => {
      respond(failedClient, jsonResponse(successClient));
      await renderView();
      await clickButton('Edit');
      await userEvent.type(screen.getByLabelText('Email'), 'info@blueocean.co.il');
      await clickButton('Save');

      expect(await screen.findByText('Success')).toBeInTheDocument();
      expect(screen.queryByText('Error Details')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();

      const [url, init] = fetchMock.mock.calls[1];
      expect(String(url)).toBe(`/api/clients/${ID}`);
      expect(init?.method).toBe('PATCH');
      expect(JSON.parse(init?.body as string)).toEqual({
        companyName: 'Blue Ocean Imports',
        address: '',
        phone: '+972 3 555 1234',
        email: 'info@blueocean.co.il',
        originPort: 'Shanghai',
        originCountry: 'China',
        destinationPort: 'Haifa',
        incoterms: 'FOB',
        shipmentType: 'FCL',
      });
    });

    it('sends NOT Available in Shipment Type as null', async () => {
      respond(successClient, jsonResponse(successClient));
      await renderView();
      await clickButton('Edit');
      await userEvent.selectOptions(screen.getByLabelText('Shipment Type'), 'NOT Available');
      await clickButton('Save');

      await screen.findByRole('button', { name: 'Edit' });
      const body = JSON.parse(fetchMock.mock.calls[1][1]?.body as string) as object;
      expect(body).toMatchObject({ shipmentType: null });
    });

    it('Cancel restores the original values without calling the server', async () => {
      respond(failedClient);
      await renderView();
      await clickButton('Edit');
      await userEvent.type(screen.getByLabelText('Company Name'), ' changed');
      await clickButton('Cancel');

      expect(screen.getByText('Blue Ocean Imports')).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      await clickButton('Edit');
      expect(screen.getByLabelText('Company Name')).toHaveValue('Blue Ocean Imports');
    });

    it('stays in edit mode with the entered values on a duplicate', async () => {
      respond(failedClient, jsonResponse({ error: 'DUPLICATE_CLIENT' }, 409));
      await renderView();
      await clickButton('Edit');
      await userEvent.type(screen.getByLabelText('Email'), 'taken@x.com');
      await clickButton('Save');

      expect(
        await screen.findByText('A client with this company name and email already exists.'),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toHaveValue('taken@x.com');
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    });

    it('stays in edit mode and shows a general error when saving fails', async () => {
      respond(failedClient, new Response(null, { status: 500 }));
      await renderView();
      await clickButton('Edit');
      await clickButton('Save');

      expect(
        await screen.findByText('Something went wrong. Please try again.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('blocks Save and marks the fields when email and phone are invalid', async () => {
      respond(failedClient, jsonResponse(successClient));
      await renderView();
      await clickButton('Edit');
      await userEvent.type(screen.getByLabelText('Email'), 'abc');
      await userEvent.clear(screen.getByLabelText('Phone'));
      await userEvent.type(screen.getByLabelText('Phone'), 'xyz');
      await clickButton('Save');

      expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
      expect(screen.getByText('Enter a valid phone number.')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Correcting a field clears its message, and Save works again
      await userEvent.clear(screen.getByLabelText('Email'));
      await userEvent.type(screen.getByLabelText('Email'), 'info@blueocean.co.il');
      expect(screen.queryByText('Enter a valid email address.')).not.toBeInTheDocument();
      await userEvent.clear(screen.getByLabelText('Phone'));
      await clickButton('Save');
      expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('shows a general error, not Client not found, when the server rejects a save', async () => {
      respond(failedClient, jsonResponse({ error: 'BAD_REQUEST' }, 400));
      await renderView();
      await clickButton('Edit');
      await clickButton('Save');

      expect(
        await screen.findByText('Something went wrong. Please try again.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('shows Client not found when the client was deleted meanwhile', async () => {
      respond(failedClient, jsonResponse({ error: 'NOT_FOUND' }, 404));
      await renderView();
      await clickButton('Edit');
      await clickButton('Save');
      expect(await screen.findByText('Client not found.')).toBeInTheDocument();
    });
  });

  describe('deleting', () => {
    // jsdom has no <dialog> support, so the element's methods are stubbed
    beforeEach(() => {
      HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
        this.open = true;
      });
      HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
        this.open = false;
      });
    });

    const openDialog = async () => {
      await clickButton('Delete');
      return within(await screen.findByRole('dialog'));
    };

    it('asks for confirmation and sends nothing until confirmed', async () => {
      respond(successClient);
      await renderView();
      const dialog = await openDialog();

      expect(dialog.getByRole('heading', { name: 'Delete Client' })).toBeInTheDocument();
      expect(dialog.getByText('Are you sure you want to delete this client?')).toBeInTheDocument();
      expect(dialog.getByText('This action cannot be undone.')).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each(['Cancel', 'Close'])('%s closes without deleting', async (name) => {
      respond(successClient);
      await renderView();
      const dialog = await openDialog();
      await userEvent.click(dialog.getByRole('button', { name }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(router.replace).not.toHaveBeenCalled();
    });

    it('Delete removes the client and returns to Clients', async () => {
      respond(successClient, new Response(null, { status: 204 }));
      await renderView();
      const dialog = await openDialog();
      await userEvent.click(dialog.getByRole('button', { name: 'Delete' }));

      await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/clients'));
      expect(requests()[1]).toEqual({ url: `/api/clients/${ID}`, method: 'DELETE' });
    });

    it('shows an error in the dialog when the delete fails', async () => {
      respond(successClient, new Response(null, { status: 500 }));
      await renderView();
      const dialog = await openDialog();
      await userEvent.click(dialog.getByRole('button', { name: 'Delete' }));

      expect(
        await dialog.findByText('Something went wrong. Please try again.'),
      ).toBeInTheDocument();
      expect(router.replace).not.toHaveBeenCalled();
      expect(dialog.getByRole('button', { name: 'Delete' })).toBeEnabled();
    });
  });
});
