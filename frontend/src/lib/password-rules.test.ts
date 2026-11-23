import {
  COMMON_PASSWORD_MESSAGE,
  PASSWORD_HINT,
  USERNAME_RULE_MESSAGE,
  validatePassword,
  validateSignUp,
} from './password-rules';

const STRONG = 'Ordan#Cargo26';

describe('validateSignUp', () => {
  it('accepts a valid username and matching strong passwords', () => {
    expect(validateSignUp('Dana.K_1-x', STRONG, STRONG)).toBeNull();
  });

  it.each(['ab', 'a'.repeat(31), 'dana k', 'דנה', 'dana@x', ''])(
    'rejects the username %p',
    (username) => {
      expect(validateSignUp(username, STRONG, STRONG)).toBe(USERNAME_RULE_MESSAGE);
    },
  );

  it('rejects 12345678 and says what is missing', () => {
    expect(validateSignUp('dana', '12345678', '12345678')).toBe(
      'Password must include: at least 10 characters, an uppercase letter, a lowercase letter, a symbol.',
    );
  });

  it('rejects passwords that do not match', () => {
    expect(validateSignUp('dana', STRONG, 'Ordan#Cargo27')).toBe('Passwords do not match.');
  });
});

// Same examples as backend/src/users/password-policy.spec.ts, so both sides stay in sync
describe('validatePassword', () => {
  it.each([
    ['Ordan#Car6', null],
    ['Ordan#Ca6', 'Password must include: at least 10 characters.'],
    ['ordan#cargo26', 'Password must include: an uppercase letter.'],
    ['ORDAN#CARGO26', 'Password must include: a lowercase letter.'],
    ['Ordan#Cargo', 'Password must include: a digit.'],
    ['OrdanCargo26', 'Password must include: a symbol.'],
    ['Ordan Cargo26', 'Password must include: a symbol.'],
  ])('checks %p', (password, message) => {
    expect(validatePassword(password)).toBe(message);
  });

  it.each(['Password123!', 'pASSWORD123!', 'P@ssw0rd123', 'Qwerty123!'])(
    'blocks the common password %p',
    (password) => {
      expect(validatePassword(password)).toBe(COMMON_PASSWORD_MESSAGE);
    },
  );

  it('rejects a too long password', () => {
    expect(validatePassword('Aa1!'.repeat(33))).toBe('Password must be at most 128 characters.');
  });

  it('describes every rule in the hint', () => {
    expect(PASSWORD_HINT).toBe(
      'At least 10 characters, with an uppercase letter, a lowercase letter, a digit and a symbol (like ! or #).',
    );
  });
});
