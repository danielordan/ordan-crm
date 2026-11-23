import { passwordSignInSchema, registerSchema } from './password-credentials.dto';

describe('registerSchema', () => {
  it('lowercases and trims the username', () => {
    expect(registerSchema.parse({ username: '  Dana.K_1 ', password: 'Ordan#Cargo26' })).toEqual({
      username: 'dana.k_1',
      password: 'Ordan#Cargo26',
    });
  });

  it.each([
    {},
    { username: 'dana' },
    { username: 'dana', password: '12345678' },
    { username: 'dana', password: 'secret123' },
    { username: 'dana', password: 'OrdanCargo26' },
    { username: 'dana', password: 'Password123!' },
    { password: 'Ordan#Cargo26' },
    { username: 'ab', password: 'Ordan#Cargo26' },
    { username: 'a'.repeat(31), password: 'Ordan#Cargo26' },
    { username: 'dana k', password: 'Ordan#Cargo26' },
    { username: 'דנה', password: 'Ordan#Cargo26' },
    { username: 'dana', password: 'short' },
    { username: 'dana', password: 'Aa1!'.repeat(33) },
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
