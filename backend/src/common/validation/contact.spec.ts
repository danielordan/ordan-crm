import { isEnglishText, isValidEmail, isValidPhone, suggestEmail } from './contact';

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

describe('isEnglishText', () => {
  it.each(['ABC Logistics Ltd.', '123 Port St, New York', 'FOB', '+1 (212) 555-0100', ''])(
    'accepts %s',
    (value) => {
      expect(isEnglishText(value)).toBe(true);
    },
  );

  it.each(['חברה בע"מ', 'Москва', 'Zürich', 'São Paulo', 'Port 上海'])('rejects %s', (value) => {
    expect(isEnglishText(value)).toBe(false);
  });
});
