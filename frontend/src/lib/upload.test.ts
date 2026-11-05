import { SessionExpiredError } from './clients-api';
import { MAX_UPLOAD_BYTES, uploadDocument, validatePdfFile } from './upload';

const pdf = new File(['%PDF-1.7'], 'hbl.pdf', { type: 'application/pdf' });
const NOT_PDF = 'Only PDF files are supported.';
const TOO_LARGE = 'File is too large. Maximum size is 4 MB.';
const TECHNICAL = 'Something went wrong. Please try again.';

function fileOfSize(size: number): File {
  const file = new File(['x'], 'hbl.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('validatePdfFile', () => {
  it('accepts a PDF up to exactly 4 MB, with the extension in any case', () => {
    expect(validatePdfFile(pdf)).toBeNull();
    expect(validatePdfFile(fileOfSize(MAX_UPLOAD_BYTES))).toBeNull();
    expect(validatePdfFile(new File(['x'], 'DOC-1.PDF', { type: 'application/pdf' }))).toBeNull();
  });

  it.each([
    ['a wrong type', new File(['x'], 'hbl.pdf', { type: 'text/plain' })],
    ['a wrong extension', new File(['x'], 'hbl.txt', { type: 'application/pdf' })],
    ['no type', new File(['x'], 'hbl.pdf')],
  ])('rejects %s', (_name, file) => {
    expect(validatePdfFile(file)?.message).toBe(NOT_PDF);
  });

  it('rejects a file above 4 MB', () => {
    expect(validatePdfFile(fileOfSize(MAX_UPLOAD_BYTES + 1))?.message).toBe(TOO_LARGE);
  });
});

describe('uploadDocument', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  const respond = (body: unknown, status = 200) =>
    fetchMock.mockResolvedValue(Response.json(body, { status }));

  it.each([
    [
      { result: 'created', processingStatus: 'Success', clientId: 'x' },
      'success',
      'Client added successfully.',
    ],
    [{ result: 'duplicate' }, 'info', 'Client already exists. No changes were made.'],
  ])('maps %j to the %s message', async (body, variant, message) => {
    respond(body);
    await expect(uploadDocument(pdf)).resolves.toEqual({ variant, message });
  });

  it('explains what is missing and points to the saved client', async () => {
    respond({
      result: 'created',
      processingStatus: 'Failed',
      clientId: 'x',
      errorDetails: 'Missing required fields: Email.',
    });
    await expect(uploadDocument(pdf)).resolves.toEqual({
      variant: 'warning',
      message: 'Information was extracted, but some required fields are missing.',
      details: 'Missing required fields: Email.',
      clientId: 'x',
    });
  });

  it('offers Try Again when nothing could be extracted', async () => {
    respond({ result: 'extraction_failed' });
    await expect(uploadDocument(pdf)).resolves.toEqual({
      variant: 'error',
      message: 'Could not extract information from the file. Please try again.',
      canRetry: true,
    });
  });

  it.each([
    [400, NOT_PDF],
    [413, TOO_LARGE],
  ])('maps status %i to its message, without Try Again', async (status, message) => {
    respond({ error: 'X' }, status);
    await expect(uploadDocument(pdf)).resolves.toEqual({ variant: 'error', message });
  });

  it.each([500, 502])('offers Try Again on status %i', async (status) => {
    respond({ error: 'X' }, status);
    await expect(uploadDocument(pdf)).resolves.toEqual({
      variant: 'error',
      message: TECHNICAL,
      canRetry: true,
    });
  });

  it('offers Try Again when the request fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('network'));
    await expect(uploadDocument(pdf)).resolves.toMatchObject({ canRetry: true });
  });

  it('offers Try Again on an unknown answer', async () => {
    respond({ result: 'something-else' });
    await expect(uploadDocument(pdf)).resolves.toMatchObject({ canRetry: true });
    fetchMock.mockResolvedValue(new Response('<html>not json</html>'));
    await expect(uploadDocument(pdf)).resolves.toMatchObject({ canRetry: true });
  });

  it('reports an expired session', async () => {
    respond({ error: 'UNAUTHORIZED' }, 401);
    await expect(uploadDocument(pdf)).rejects.toBeInstanceOf(SessionExpiredError);
  });
});
