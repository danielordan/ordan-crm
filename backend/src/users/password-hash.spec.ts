import { DUMMY_HASH, hashPassword, verifyPassword } from './password-hash';

describe('password hashing', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const stored = await hashPassword('secret123');
    expect(stored).toMatch(/^scrypt\$[^$]+\$[^$]+$/);
    expect(stored).not.toContain('secret123');
    await expect(verifyPassword('secret123', stored)).resolves.toBe(true);
    await expect(verifyPassword('secret124', stored)).resolves.toBe(false);
  });

  it('uses a different salt every time', async () => {
    expect(await hashPassword('secret123')).not.toBe(await hashPassword('secret123'));
  });

  it.each(['', 'plain', 'bcrypt$a$b', DUMMY_HASH])('never accepts %p', async (stored) => {
    await expect(verifyPassword('secret123', stored)).resolves.toBe(false);
  });
});
