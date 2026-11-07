import { z } from 'zod';

// Username rules (PRD 4.1): 3–30 characters, English letters, digits, dot, underscore or hyphen.
// Stored and compared in lowercase.
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const username = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase());

// Body of POST /api/v1/users/register (ARCHITECTURE 12.3)
export const registerSchema = z.object({
  username: username.pipe(z.string().regex(USERNAME_PATTERN)),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
});

// Body of POST /api/v1/users/password-sign-in. Only presence is checked here, so a wrong
// format answers like any other wrong credentials.
export const passwordSignInSchema = z.object({
  username: username.pipe(z.string().min(1).max(100)),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

export type PasswordCredentialsDto = z.output<typeof registerSchema>;
