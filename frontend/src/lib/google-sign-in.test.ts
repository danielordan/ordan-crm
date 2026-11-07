import { registerGoogleSignIn } from './google-sign-in';

describe('registerGoogleSignIn', () => {
  const register = vi.fn<(user: object) => Promise<{ id: string }>>();
  const profile = { sub: 'g-123', email: 'dana@example.com', email_verified: true, name: 'Dana' };

  beforeEach(() => {
    register.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('registers the user in the backend and returns the internal user ID', async () => {
    register.mockResolvedValue({ id: 'user-1' });
    await expect(registerGoogleSignIn(profile, register)).resolves.toBe('user-1');
    expect(register).toHaveBeenCalledWith({
      googleId: 'g-123',
      email: 'dana@example.com',
      name: 'Dana',
    });
  });

  it('denies the sign-in when registration fails', async () => {
    register.mockRejectedValue(new Error('backend down'));
    await expect(registerGoogleSignIn(profile, register)).resolves.toBeNull();
  });

  it.each([
    undefined,
    { ...profile, sub: undefined },
    { ...profile, email: null },
    { ...profile, email_verified: false },
  ])('denies an incomplete or unverified profile %#', async (value) => {
    await expect(registerGoogleSignIn(value, register)).resolves.toBeNull();
    expect(register).not.toHaveBeenCalled();
  });
});
