import { DEFAULT_VIEW, parseViewState, toApiQuery, toPageQuery } from './clients-query';

describe('clients query', () => {
  it('parses the page URL', () => {
    const params = new URLSearchParams('search=%20acme%20&status=Failed&sort=asc&page=3');
    expect(parseViewState(params)).toEqual({
      search: 'acme',
      status: 'Failed',
      sort: 'asc',
      page: 3,
    });
  });

  it('falls back to defaults for invalid values', () => {
    const params = new URLSearchParams('status=Pending&sort=x&page=-2');
    expect(parseViewState(params)).toEqual(DEFAULT_VIEW);
    expect(parseViewState(new URLSearchParams('page=abc')).page).toBe(1);
  });

  it('leaves defaults out of the page URL', () => {
    expect(toPageQuery(DEFAULT_VIEW)).toBe('');
    expect(toPageQuery({ search: 'a b', status: 'Success', sort: 'asc', page: 2 })).toBe(
      '?search=a+b&status=Success&sort=asc&page=2',
    );
  });

  it('builds the backend query', () => {
    expect(toApiQuery(DEFAULT_VIEW)).toBe('?sortOrder=desc&page=1');
    expect(toApiQuery({ search: '03-555', status: 'Failed', sort: 'asc', page: 2 })).toBe(
      '?search=03-555&processingStatus=Failed&sortOrder=asc&page=2',
    );
  });
});
