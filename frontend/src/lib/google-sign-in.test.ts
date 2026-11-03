import { allowGoogleSignIn } from './google-sign-in';

describe('allowGoogleSignIn', () => {
  const register = vi.fn<(user: object) => Promise<void>>();
  const profile = { sub: 'g-123', email: 'dana@example.com', email_verified: true, name: 'Dana' };

  beforeEach(() => {
    register.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('registers the user in the backend and allows the sign-in', async () => {
    register.mockResolvedValue();
    await expect(allowGoogleSignIn(profile, register)).resolves.toBe(true);
    expect(register).toHaveBeenCalledWith({
      googleId: 'g-123',
      email: 'dana@example.com',
      name: 'Dana',
    });
  });

  it('denies the sign-in when registration fails', async () => {
    register.mockRejectedValue(new Error('backend down'));
    await expect(allowGoogleSignIn(profile, register)).resolves.toBe(false);
  });

  it.each([
    undefined,
    { ...profile, sub: undefined },
    { ...profile, email: null },
    { ...profile, email_verified: false },
  ])('denies an incomplete or unverified profile %#', async (value) => {
    await expect(allowGoogleSignIn(value, register)).resolves.toBe(false);
    expect(register).not.toHaveBeenCalled();
  });
});
