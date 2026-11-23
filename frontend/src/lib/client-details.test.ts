import { isClientId } from './client-details';

describe('isClientId', () => {
  it('accepts UUIDs', () => {
    expect(isClientId('00000000-0000-4000-8000-000000000001')).toBe(true);
    expect(isClientId('A3F1C2D4-1B2C-4D5E-8F90-ABCDEF123456')).toBe(true);
  });

  it('rejects anything else', () => {
    for (const value of ['abc', '123', '', '00000000-0000-4000-8000-00000000000z']) {
      expect(isClientId(value)).toBe(false);
    }
  });
});
