import { z } from 'zod';

// Body of POST /api/v1/users/google-sign-in (ARCHITECTURE 12.3)
export const googleSignInSchema = z.object({
  googleId: z.string().trim().min(1).max(255),
  email: z.string().trim().min(1).max(320),
  name: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((value) => value || null),
});

export type GoogleSignInDto = z.output<typeof googleSignInSchema>;
