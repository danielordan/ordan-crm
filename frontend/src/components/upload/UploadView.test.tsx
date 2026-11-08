import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MAX_UPLOAD_BYTES } from '@/lib/upload';
import { UploadView } from './UploadView';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const pdf = (name = 'hbl.pdf') => new File(['%PDF-1.7'], name, { type: 'application/pdf' });
const fetchMock = vi.fn<typeof fetch>();
const answer = (body: unknown, status = 200) => Promise.resolve(Response.json(body, { status }));

function setup() {
  // `applyAccept: false` lets the tests pick a wrong file type, as drag and drop can
  const user = userEvent.setup({ applyAccept: false });
  render(<UploadView />);
  const input = screen.getByLabelText('PDF file');
  return { user, input };
}

describe('UploadView', () => {
  beforeEach(() => {
    router.push.mockReset();
    router.replace.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('shows the upload area as designed', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Upload PDF' })).toBeInTheDocument();
    expect(screen.getByText('Drag and drop PDF file here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose PDF File' })).toBeEnabled();
    expect(
      screen.getByText('Only PDF files are supported. Maximum size: 4 MB.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Upload Another/ })).not.toBeInTheDocument();
  });

  it('starts right after a file is chosen, and sends it in the "file" field', async () => {
    fetchMock.mockImplementation(() => answer({ result: 'duplicate' }));
    const { user, input } = setup();
    const file = pdf();

    await user.upload(input, file);

    await screen.findByText('Client already exists. No changes were made.');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/documents/process');
    expect(init?.method).toBe('POST');
    expect((init?.body as FormData).get('file')).toEqual(file);
  });

  it('shows Processing and disables the area until the answer arrives', async () => {
    let finish: (response: Response) => void = () => {};
    fetchMock.mockImplementation(() => new Promise((resolve) => (finish = resolve)));
    const { user, input } = setup();

    await user.upload(input, pdf());

    expect(await screen.findByText('Processing...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose PDF File' })).toBeDisabled();
    expect(input).toBeDisabled();

    finish(Response.json({ result: 'created', processingStatus: 'Success', clientId: 'x' }));

    await screen.findByText('Client added successfully.');
    expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose PDF File' })).toBeEnabled();
  });

  it('accepts a dropped file, and only the first of several', async () => {
    fetchMock.mockImplementation(() => answer({ result: 'duplicate' }));
    setup();
    const first = pdf('first.pdf');

    fireEvent.drop(screen.getByTestId('drop-area'), {
      dataTransfer: { files: [first, pdf('second.pdf')] },
    });

    await screen.findByText('Client already exists. No changes were made.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0][1]?.body as FormData).get('file')).toEqual(first);
  });

  it('blocks a wrong file type and a large file without calling the server', async () => {
    const { user, input } = setup();

    await user.upload(input, new File(['x'], 'notes.txt', { type: 'text/plain' }));
    expect(await screen.findByText('Only PDF files are supported.')).toBeInTheDocument();

    const large = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], 'big.pdf', {
      type: 'application/pdf',
    });
    await user.upload(input, large);
    expect(await screen.findByText('File is too large. Maximum size is 4 MB.')).toBeInTheDocument();
    expect(screen.queryByText('Only PDF files are supported.')).not.toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the same file again with Try Again', async () => {
    fetchMock.mockImplementationOnce(() => answer({ error: 'INTERNAL_ERROR' }, 500));
    fetchMock.mockImplementationOnce(() =>
      answer({ result: 'created', processingStatus: 'Success', clientId: 'x' }),
    );
    const { user, input } = setup();
    const file = pdf();

    await user.upload(input, file);
    await screen.findByText('Something went wrong. Please try again.');
    await user.click(screen.getByRole('button', { name: 'Try Again' }));

    await screen.findByText('Client added successfully.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[1][1]?.body as FormData).get('file')).toEqual(file);
    expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
  });

  it('replaces the previous message with the next upload, also for the same file', async () => {
    fetchMock.mockImplementationOnce(() =>
      answer({ result: 'created', processingStatus: 'Success', clientId: 'x' }),
    );
    fetchMock.mockImplementationOnce(() => answer({ result: 'duplicate' }));
    const { user, input } = setup();
    const file = pdf();

    await user.upload(input, file);
    await screen.findByText('Client added successfully.');
    await user.upload(input, file);

    await screen.findByText('Client already exists. No changes were made.');
    expect(screen.queryByText('Client added successfully.')).not.toBeInTheDocument();
  });

  it('shows what is missing and opens the client for editing', async () => {
    fetchMock.mockImplementation(() =>
      answer({
        result: 'created',
        processingStatus: 'Failed',
        clientId: 'client-1',
        errorDetails: 'Missing required fields: Email, Origin Country.',
      }),
    );
    const { user, input } = setup();

    await user.upload(input, pdf());

    await screen.findByText('Information was extracted, but some required fields are missing.');
    expect(screen.getByText('Missing required fields: Email, Origin Country.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit Client' }));
    expect(router.push).toHaveBeenCalledWith('/clients/client-1?edit=true');
  });

  it('offers Try Again and no editing when nothing could be extracted', async () => {
    fetchMock.mockImplementationOnce(() => answer({ result: 'extraction_failed' }));
    fetchMock.mockImplementationOnce(() =>
      answer({ result: 'created', processingStatus: 'Success', clientId: 'x' }),
    );
    const { user, input } = setup();

    await user.upload(input, pdf());

    await screen.findByText('Could not extract information from the file. Please try again.');
    expect(screen.queryByRole('button', { name: 'Edit Client' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    await screen.findByText('Client added successfully.');
  });

  it('allows Try Again 3 times, then says the file cannot be processed', async () => {
    fetchMock.mockImplementation(() => answer({ result: 'extraction_failed' }));
    const { user, input } = setup();

    await user.upload(input, pdf());
    for (let attempt = 1; attempt <= 3; attempt++) {
      await user.click(await screen.findByRole('button', { name: 'Try Again' }));
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(attempt + 1));
    }

    await screen.findByText(
      'Could not process this file after several attempts. Please handle it manually.',
    );
    expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();

    // A new file gets its own 3 attempts
    await user.upload(input, pdf('other.pdf'));
    await screen.findByRole('button', { name: 'Try Again' });
  });

  it('goes to Sign In when the session has expired', async () => {
    fetchMock.mockImplementation(() => answer({ error: 'UNAUTHORIZED' }, 401));
    const { user, input } = setup();

    await user.upload(input, pdf());

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/sign-in?callbackUrl=%2Fupload'),
    );
  });
});
