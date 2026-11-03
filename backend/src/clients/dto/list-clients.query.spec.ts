import { listClientsQuerySchema } from './list-clients.query';

describe('listClientsQuerySchema', () => {
  it('applies defaults', () => {
    expect(listClientsQuerySchema.parse({})).toEqual({
      search: undefined,
      processingStatus: undefined,
      sortOrder: 'desc',
      page: 1,
      limit: 25,
    });
  });

  it('accepts valid values and treats empty ones as not given', () => {
    expect(
      listClientsQuerySchema.parse({
        search: '  acme ',
        processingStatus: 'Failed',
        sortOrder: 'asc',
        page: '3',
        limit: '25',
      }),
    ).toEqual({ search: 'acme', processingStatus: 'Failed', sortOrder: 'asc', page: 3, limit: 25 });
    expect(listClientsQuerySchema.parse({ search: '', processingStatus: '', page: '' })).toEqual(
      expect.objectContaining({ search: undefined, processingStatus: undefined, page: 1 }),
    );
  });

  it.each([
    { page: '0' },
    { page: '-1' },
    { page: 'abc' },
    { page: '1.5' },
    { page: '1e3' },
    { page: '10001' },
    { limit: '100' },
    { limit: '10' },
    { sortOrder: 'up' },
    { processingStatus: 'Pending' },
    { processingStatus: 'success' },
    { search: 'x'.repeat(201) },
    { page: ['1', '2'] },
    { search: ['a', 'b'] },
  ])('rejects %p', (query) => {
    expect(listClientsQuerySchema.safeParse(query).success).toBe(false);
  });
});
