import { USERNAME_RULE_MESSAGE, validateSignUp } from './password-rules';

describe('validateSignUp', () => {
  it('accepts a valid username and matching passwords', () => {
    expect(validateSignUp('Dana.K_1-x', 'secret123', 'secret123')).toBeNull();
  });

  it.each(['ab', 'a'.repeat(31), 'dana k', 'דנה', 'dana@x', ''])(
    'rejects the username %p',
    (username) => {
      expect(validateSignUp(username, 'secret123', 'secret123')).toBe(USERNAME_RULE_MESSAGE);
    },
  );

  it('rejects a short or a too long password', () => {
    expect(validateSignUp('dana', 'short', 'short')).toBe(
      'Password must be at least 8 characters.',
    );
    const long = 'x'.repeat(129);
    expect(validateSignUp('dana', long, long)).toBe('Password must be at most 128 characters.');
  });

  it('rejects passwords that do not match', () => {
    expect(validateSignUp('dana', 'secret123', 'secret124')).toBe('Passwords do not match.');
  });
});
