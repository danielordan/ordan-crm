import { buildDuplicateQuery, type ClientsRepository } from './clients.repository';
import { DuplicateDetectionService } from './duplicate-detection.service';

describe('DuplicateDetectionService', () => {
  const findDuplicateId = jest.fn<Promise<string | null>, unknown[]>();
  const service = new DuplicateDetectionService({
    findDuplicateId,
  } as unknown as ClientsRepository);

  beforeEach(() => {
    findDuplicateId.mockReset().mockResolvedValue(null);
  });

  it('does not query without company name and email', async () => {
    await expect(service.findDuplicate({ companyName: null, email: '  ' })).resolves.toBeNull();
    expect(findDuplicateId).not.toHaveBeenCalled();
  });

  it('compares normalized values and passes the excluded client', async () => {
    await service.findDuplicate({ companyName: '  ACME   Ltd ', email: ' A@Acme.COM ' }, 'id-1');
    expect(findDuplicateId).toHaveBeenCalledWith(
      { companyName: 'acme ltd', email: 'a@acme.com' },
      'id-1',
    );
  });

  it('returns the matching client', async () => {
    findDuplicateId.mockResolvedValue('id-2');
    await expect(service.findDuplicate({ companyName: 'Acme', email: null })).resolves.toBe('id-2');
  });
});

describe('buildDuplicateQuery', () => {
  it('matches both values when both exist', () => {
    const { text, values } = buildDuplicateQuery({ companyName: 'acme', email: 'a@acme.com' });
    expect(text).toContain('company_name_normalized = $1 AND email_normalized = $2');
    expect(values).toEqual(['acme', 'a@acme.com']);
  });

  it('matches only the company name when there is no email', () => {
    const { text, values } = buildDuplicateQuery({ companyName: 'acme', email: null });
    expect(text).toContain('company_name_normalized = $1');
    expect(text).not.toContain('email_normalized');
    expect(values).toEqual(['acme']);
  });

  it('matches only the email when there is no company name', () => {
    const { text, values } = buildDuplicateQuery({ companyName: null, email: 'a@acme.com' });
    expect(text).toContain('email_normalized = $1');
    expect(text).not.toContain('company_name_normalized');
    expect(values).toEqual(['a@acme.com']);
  });

  it('excludes the edited client', () => {
    const { text, values } = buildDuplicateQuery({ companyName: 'acme', email: null }, 'id-1');
    expect(text).toContain('id <> $2');
    expect(values).toEqual(['acme', 'id-1']);
  });
});
