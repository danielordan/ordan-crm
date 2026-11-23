import { isCommonPassword, passwordProblems } from './password-policy';

// Same examples as frontend/src/lib/password-rules.test.ts, so both sides stay in sync
describe('passwordProblems', () => {
  it('accepts a strong password', () => {
    expect(passwordProblems('Ordan#Cargo26')).toEqual([]);
  });

  it('lists everything 12345678 is missing', () => {
    expect(passwordProblems('12345678')).toEqual([
      'at least 10 characters',
      'an uppercase letter',
      'a lowercase letter',
      'a symbol',
    ]);
  });

  it.each([
    ['Ordan#Car6', []],
    ['Ordan#Ca6', ['at least 10 characters']],
    ['ordan#cargo26', ['an uppercase letter']],
    ['ORDAN#CARGO26', ['a lowercase letter']],
    ['Ordan#Cargo', ['a digit']],
    ['OrdanCargo26', ['a symbol']],
    ['Ordan Cargo26', ['a symbol']],
  ])('checks %p', (password, missing) => {
    expect(passwordProblems(password)).toEqual(missing);
  });
});

describe('isCommonPassword', () => {
  it.each(['Password123!', 'pASSWORD123!', 'P@ssw0rd123', 'Qwerty123!'])('blocks %p', (p) => {
    expect(isCommonPassword(p)).toBe(true);
  });

  it('allows an uncommon password', () => {
    expect(isCommonPassword('Ordan#Cargo26')).toBe(false);
  });
});
