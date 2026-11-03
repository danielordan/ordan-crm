import { formatTableDate, isMissing } from './format';

describe('formatTableDate', () => {
  it('formats as "Jul 20, 2026"', () => {
    expect(formatTableDate('2026-07-20T11:32:00.000Z')).toBe('Jul 20, 2026');
  });

  it('uses Asia/Jerusalem, not UTC, around midnight', () => {
    // 22:30 UTC on Jul 19 is 01:30 on Jul 20 in Israel (UTC+3 in summer)
    expect(formatTableDate('2026-07-19T22:30:00.000Z')).toBe('Jul 20, 2026');
  });
});

describe('isMissing', () => {
  it.each([null, undefined, '', '  '])('%p is missing', (value) => {
    expect(isMissing(value)).toBe(true);
  });

  it('a value is not missing', () => {
    expect(isMissing('x')).toBe(false);
  });
});
