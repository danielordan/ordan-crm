import { buildListQuery, escapeLike, phoneSearchPatterns } from './clients.repository';
import type { ListClientsQuery } from './dto/list-clients.query';

const base: ListClientsQuery = {
  search: undefined,
  processingStatus: undefined,
  sortOrder: 'desc',
  page: 1,
  limit: 25,
};

describe('escapeLike', () => {
  it('escapes LIKE wildcards and the escape character', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
  });
});

describe('phoneSearchPatterns', () => {
  it('matches local Israeli numbers in international form too', () => {
    expect(phoneSearchPatterns('03-555')).toEqual(['03555', '9723555']);
  });

  it('uses digits only for other numbers', () => {
    expect(phoneSearchPatterns('+972 3 555')).toEqual(['9723555']);
    expect(phoneSearchPatterns('(212) 555')).toEqual(['212555']);
  });

  it('ignores text that is not phone-like', () => {
    expect(phoneSearchPatterns('acme2024@example.com')).toEqual([]);
    expect(phoneSearchPatterns('Blue Ocean')).toEqual([]);
  });
});

describe('buildListQuery', () => {
  it('builds the default query: newest first, 26 rows from offset 0', () => {
    const { text, values } = buildListQuery(base);
    expect(text).not.toContain('WHERE');
    expect(text).toContain('ORDER BY date_added DESC, id DESC');
    expect(text).toContain('LIMIT $1 OFFSET $2');
    expect(values).toEqual([26, 0]);
  });

  it('sorts oldest first and pages by 25', () => {
    const { text, values } = buildListQuery({ ...base, sortOrder: 'asc', page: 3 });
    expect(text).toContain('ORDER BY date_added ASC, id ASC');
    expect(values).toEqual([26, 50]);
  });

  it('filters by processing status as a parameter', () => {
    const { text, values } = buildListQuery({ ...base, processingStatus: 'Failed' });
    expect(text).toContain('WHERE processing_status = $1');
    expect(values[0]).toBe('Failed');
  });

  it('searches every text field with escaped input, and phones for phone-like text', () => {
    const { text, values } = buildListQuery({ ...base, search: '03-555' });
    for (const column of [
      'company_name',
      'email',
      'address',
      'origin_port',
      'origin_country',
      'destination_port',
      'incoterms',
      'shipment_type',
    ]) {
      expect(text).toContain(`${column} ILIKE $1 ESCAPE '\\'`);
    }
    expect(text).toContain('phone_digits LIKE $2 OR phone_digits LIKE $3');
    expect(values.slice(0, 3)).toEqual(['%03-555%', '%03555%', '%9723555%']);
  });

  it('never puts user input into the SQL text', () => {
    const search = `x' OR 1=1; DROP TABLE clients; --%_`;
    const { text, values } = buildListQuery({ ...base, search, processingStatus: 'Success' });
    expect(text).not.toContain('DROP');
    expect(text).not.toContain('1=1');
    expect(values[0]).toBe(`%x' OR 1=1; DROP TABLE clients; --\\%\\_%`);
  });
});
