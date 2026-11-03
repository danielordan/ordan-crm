import { buildSeedClients, SEED_COUNT } from './seed-data';

describe('buildSeedClients', () => {
  const clients = buildSeedClients();

  it('covers enough rows for three pages, with both statuses', () => {
    expect(clients).toHaveLength(SEED_COUNT);
    expect(SEED_COUNT).toBeGreaterThan(50);
    expect(clients.some((c) => c.processingStatus === 'Success')).toBe(true);
    expect(clients.some((c) => c.processingStatus === 'Failed')).toBe(true);
  });

  it('covers missing values, including a row without company name and email', () => {
    expect(clients.some((c) => c.phone === null)).toBe(true);
    expect(clients.some((c) => c.address === null)).toBe(true);
    expect(clients.some((c) => c.companyName === null && c.email === null)).toBe(true);
    expect(clients.some((c) => c.phone?.startsWith('+972 3 555'))).toBe(true);
  });

  it('keeps status consistent with required fields', () => {
    for (const c of clients) {
      const complete = [
        c.companyName,
        c.email,
        c.originPort,
        c.originCountry,
        c.destinationPort,
        c.incoterms,
        c.shipmentType,
      ].every((v) => v !== null);
      expect(c.processingStatus).toBe(complete ? 'Success' : 'Failed');
      expect(c.errorDetails === null).toBe(complete);
    }
  });

  it('has unique IDs and no duplicate company + email pairs', () => {
    expect(new Set(clients.map((c) => c.id)).size).toBe(clients.length);
    const pairs = clients
      .filter((c) => c.companyNameNormalized && c.emailNormalized)
      .map((c) => `${c.companyNameNormalized}|${c.emailNormalized}`);
    expect(new Set(pairs).size).toBe(pairs.length);
  });
});
