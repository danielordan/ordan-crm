import { z } from 'zod';
import { PASSWORD_MAX_LENGTH, isCommonPassword, passwordProblems } from '../password-policy';

// Username rules (PRD 4.1): 3–30 characters, English letters, digits, dot, underscore or hyphen.
// Stored and compared in lowercase.
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

const username = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase());

// Body of POST /api/v1/users/register (ARCHITECTURE 12.3)
export const registerSchema = z.object({
  username: username.pipe(z.string().regex(USERNAME_PATTERN)),
  // Strong password rules apply to new accounts only (PRD 4.1)
  password: z
    .string()
    .max(PASSWORD_MAX_LENGTH)
    .refine((value) => passwordProblems(value).length === 0 && !isCommonPassword(value)),
});

// Body of POST /api/v1/users/password-sign-in. Only presence is checked here, so a wrong
// format answers like any other wrong credentials.
export const passwordSignInSchema = z.object({
  username: username.pipe(z.string().min(1).max(100)),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

export type PasswordCredentialsDto = z.output<typeof registerSchema>;
