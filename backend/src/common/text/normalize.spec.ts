import { normalizeCompanyName, normalizeEmail, phoneToDigits } from './normalize';

describe('normalize', () => {
  it('normalizes company names: trim, collapse spaces, lowercase, NFKC', () => {
    expect(normalizeCompanyName('  Blue   Ocean\tIMPORTS  ')).toBe('blue ocean imports');
    expect(normalizeCompanyName('ＡＢＣ Ltd')).toBe('abc ltd');
  });

  it('normalizes emails: trim and lowercase', () => {
    expect(normalizeEmail('  Info@Example.COM ')).toBe('info@example.com');
  });

  it('keeps only phone digits', () => {
    expect(phoneToDigits('+972 (3) 555-1234')).toBe('97235551234');
  });

  it.each([null, undefined, '', '   '])('returns null for empty input (%p)', (value) => {
    expect(normalizeCompanyName(value)).toBeNull();
    expect(normalizeEmail(value)).toBeNull();
    expect(phoneToDigits(value)).toBeNull();
  });

  it('returns null for a phone without digits', () => {
    expect(phoneToDigits('N/A')).toBeNull();
  });
});
