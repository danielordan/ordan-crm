import type { ClientFields } from './client.types';
import { changedFieldNames } from './clients.service';

const current = {
  companyName: 'Acme',
  address: null,
  phone: '03-1234567',
  email: 'a@acme.com',
  originPort: null,
  originCountry: null,
  destinationPort: null,
  incoterms: null,
  shipmentType: 'FCL',
} as ClientFields;

describe('changedFieldNames', () => {
  it('lists only fields whose value changed', () => {
    expect(
      changedFieldNames(
        { companyName: 'Acme', phone: '03-7654321', address: 'Tel Aviv', shipmentType: 'FCL' },
        current,
      ),
    ).toEqual(['phone', 'address']);
  });

  it('counts clearing a value as a change', () => {
    expect(changedFieldNames({ email: null }, current)).toEqual(['email']);
  });
});
