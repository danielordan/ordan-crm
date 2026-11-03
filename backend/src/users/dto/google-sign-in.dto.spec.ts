import { googleSignInSchema } from './google-sign-in.dto';

describe('googleSignInSchema', () => {
  it('accepts a full body', () => {
    expect(googleSignInSchema.parse({ googleId: '123', email: 'a@b.com', name: 'Dana' })).toEqual({
      googleId: '123',
      email: 'a@b.com',
      name: 'Dana',
    });
  });

  it('treats a missing or empty name as null', () => {
    expect(googleSignInSchema.parse({ googleId: '1', email: 'a@b.com' }).name).toBeNull();
    expect(
      googleSignInSchema.parse({ googleId: '1', email: 'a@b.com', name: ' ' }).name,
    ).toBeNull();
  });

  it.each([
    {},
    { email: 'a@b.com' },
    { googleId: '1' },
    { googleId: '', email: 'a@b.com' },
    { googleId: 1, email: 'a@b.com' },
  ])('rejects %p', (body) => {
    expect(googleSignInSchema.safeParse(body).success).toBe(false);
  });
});
