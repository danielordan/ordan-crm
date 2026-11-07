// Username and password rules for sign-up (PRD 4.1). The backend checks the same rules.
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const USERNAME_MAX_LENGTH = 30;

export const USERNAME_RULE_MESSAGE =
  'Username must be 3–30 characters: English letters, digits, dot, underscore or hyphen.';

// Returns the first problem as a message for the user, or null when everything is valid
export function validateSignUp(username: string, password: string, confirm: string): string | null {
  if (!USERNAME_PATTERN.test(username)) return USERNAME_RULE_MESSAGE;
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}
