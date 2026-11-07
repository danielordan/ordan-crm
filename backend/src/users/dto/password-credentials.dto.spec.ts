import { passwordSignInSchema, registerSchema } from './password-credentials.dto';

describe('registerSchema', () => {
  it('lowercases and trims the username', () => {
    expect(registerSchema.parse({ username: '  Dana.K_1 ', password: 'secret123' })).toEqual({
      username: 'dana.k_1',
      password: 'secret123',
    });
  });

  it.each([
    {},
    { username: 'dana' },
    { password: 'secret123' },
    { username: 'ab', password: 'secret123' },
    { username: 'a'.repeat(31), password: 'secret123' },
    { username: 'dana k', password: 'secret123' },
    { username: 'דנה', password: 'secret123' },
    { username: 'dana', password: 'short' },
    { username: 'dana', password: 'x'.repeat(129) },
  ])('rejects %p', (body) => {
    expect(registerSchema.safeParse(body).success).toBe(false);
  });
});

describe('passwordSignInSchema', () => {
  it('accepts any non-empty username and password', () => {
    expect(passwordSignInSchema.parse({ username: 'Ab', password: 'x' })).toEqual({
      username: 'ab',
      password: 'x',
    });
  });

  it.each([{}, { username: '', password: 'x' }, { username: 'dana', password: '' }])(
    'rejects %p',
    (body) => {
      expect(passwordSignInSchema.safeParse(body).success).toBe(false);
    },
  );
});
