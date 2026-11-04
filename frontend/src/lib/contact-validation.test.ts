import { toFormValues, type Client } from './client-details';
import {
  INVALID_EMAIL,
  INVALID_PHONE,
  isValidEmail,
  isValidPhone,
  suggestEmail,
  validateContactFields,
} from './contact-validation';

const client: Client = {
  id: 'id-1',
  companyName: 'Acme',
  address: null,
  phone: 'ask office',
  email: null,
  originPort: null,
  originCountry: null,
  destinationPort: null,
  incoterms: null,
  shipmentType: null,
  dateAdded: '2026-07-20T11:32:00.000Z',
  processingStatus: 'Failed',
  errorDetails: 'Missing required fields: Email.',
};

const form = toFormValues(client);

describe('isValidEmail', () => {
  it.each([
    'name@company.com',
    'a.b+c@sub.company.co.il',
    ' name@company.com ',
    'name@company.co',
    'NAME@GMAIL.COM',
    'first_last-1@my-company.org',
  ])('accepts %j', (value) => {
    expect(isValidEmail(value)).toBe(true);
  });

  it.each([
    'abc',
    'abc@',
    '@company.com',
    'abc@company',
    'a b@company.com',
    'a@b@company.com',
    '.name@company.com',
    'name.@company.com',
    'na..me@company.com',
    'name@company..com',
    'name@.company.com',
    'name@company.com.',
    'name@-company.com',
    'name@company-.com',
    'name@company.c',
    'name@company.123',
    'name@comp_any.com',
    'name,x@company.com',
    `${'a'.repeat(65)}@company.com`,
    `name@${'a'.repeat(250)}.com`,
    'name@gmail.co',
    'name@GMAIL.CO',
    'name@gmial.com',
    'name@hotmail.co',
    'name@company.con',
  ])('rejects %j', (value) => {
    expect(isValidEmail(value)).toBe(false);
  });
});

describe('suggestEmail', () => {
  it.each([
    ['name@gmail.co', 'name@gmail.com'],
    ['Name@GMIAL.com', 'Name@gmail.com'],
    ['name@walla.co', 'name@walla.co.il'],
    ['name@company.con', 'name@company.com'],
  ])('suggests a correction for %j', (value, expected) => {
    expect(suggestEmail(value)).toBe(expected);
  });

  it.each(['name@gmail.com', 'name@company.co', 'name@yahoo.co.uk', 'name@walla.co.il', 'abc'])(
    'has no suggestion for %j',
    (value) => {
      expect(suggestEmail(value)).toBeNull();
    },
  );
});

describe('isValidPhone', () => {
  it.each(['+972 3 555 1234', '03-555-1234', '(212) 555-0100', '+86 21 1234 5678', '0501234'])(
    'accepts %j',
    (value) => {
      expect(isValidPhone(value)).toBe(true);
    },
  );

  it.each(['abc', '03-555', '050-123456a', '123456', '+-()', 'call me 0501234567'])(
    'rejects %j',
    (value) => {
      expect(isValidPhone(value)).toBe(false);
    },
  );
});

describe('validateContactFields', () => {
  it('reports changed values in the wrong format', () => {
    expect(validateContactFields({ ...form, email: 'abc', phone: 'xyz' }, client)).toEqual({
      email: INVALID_EMAIL,
      phone: INVALID_PHONE,
    });
  });

  it('suggests a correction for a mistyped provider domain', () => {
    expect(validateContactFields({ ...form, email: 'name@gmail.co' }, client)).toEqual({
      email: 'Did you mean name@gmail.com?',
    });
  });

  it('allows empty values', () => {
    expect(validateContactFields({ ...form, email: '  ', phone: '' }, client)).toEqual({});
  });

  it('does not report an unchanged old value', () => {
    expect(validateContactFields(form, client)).toEqual({});
  });
});
