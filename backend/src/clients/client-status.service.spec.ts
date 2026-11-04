import { ClientStatusService } from './client-status.service';
import type { ClientFields } from './client.types';

const complete: ClientFields = {
  companyName: 'Acme',
  address: '1 Port Rd',
  phone: '03-555',
  email: 'a@acme.com',
  originPort: 'Shanghai',
  originCountry: 'China',
  destinationPort: 'Haifa',
  incoterms: 'FOB',
  shipmentType: 'FCL',
};

describe('ClientStatusService', () => {
  const service = new ClientStatusService();

  it('returns Success without error details when all required fields exist', () => {
    expect(service.compute(complete)).toEqual({ processingStatus: 'Success', errorDetails: null });
  });

  it('does not require address and phone', () => {
    expect(service.compute({ ...complete, address: null, phone: null })).toEqual({
      processingStatus: 'Success',
      errorDetails: null,
    });
  });

  it.each<[keyof ClientFields, string]>([
    ['companyName', 'Company Name'],
    ['email', 'Email'],
    ['originPort', 'Origin Port'],
    ['originCountry', 'Origin Country'],
    ['destinationPort', 'Destination Port'],
    ['incoterms', 'Incoterms'],
    ['shipmentType', 'Shipment Type'],
  ])('fails when %s is missing', (field, label) => {
    expect(service.compute({ ...complete, [field]: null })).toEqual({
      processingStatus: 'Failed',
      errorDetails: `Missing required fields: ${label}.`,
    });
  });

  it('lists every missing field, in a fixed order', () => {
    const result = service.compute({ ...complete, incoterms: null, email: null });
    expect(result.errorDetails).toBe('Missing required fields: Email, Incoterms.');
  });

  it('treats blank text as missing', () => {
    expect(service.compute({ ...complete, email: '   ' }).processingStatus).toBe('Failed');
  });
});
