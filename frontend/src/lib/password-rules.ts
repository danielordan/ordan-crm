// Username and password rules for sign-up (PRD 4.1). The backend checks the same rules
// in backend/src/users/password-policy.ts; both sides are covered by matching tests.
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/;
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;
export const USERNAME_MAX_LENGTH = 30;

export const USERNAME_RULE_MESSAGE =
  'Username must be 3–30 characters: English letters, digits, dot, underscore or hyphen.';
export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters, with an uppercase letter, a lowercase letter, a digit and a symbol (like ! or #).`;
export const COMMON_PASSWORD_MESSAGE =
  'This password is too common. Please choose a different one.';

// Common keyboard punctuation counts as a symbol
const SYMBOL = /[!-/:-@[-`{-~]/;

const RULES: ReadonlyArray<{ missing: string; test: (password: string) => boolean }> = [
  {
    missing: `at least ${PASSWORD_MIN_LENGTH} characters`,
    test: (p) => p.length >= PASSWORD_MIN_LENGTH,
  },
  { missing: 'an uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { missing: 'a lowercase letter', test: (p) => /[a-z]/.test(p) },
  { missing: 'a digit', test: (p) => /[0-9]/.test(p) },
  { missing: 'a symbol', test: (p) => SYMBOL.test(p) },
];

// Well-known passwords that pass the rules above but are still easy to guess.
// Same list as the backend; compared without regard to letter case.
const COMMON_PASSWORDS = new Set(
  [
    'Password123!',
    'Password1234!',
    'Password@123',
    'Password#123',
    'Password1!',
    'P@ssw0rd123',
    'P@ssw0rd1234',
    'P@ssword123',
    'P@$$w0rd123',
    'Passw0rd!23',
    'Qwerty123!',
    'Qwerty1234!',
    'Qwerty@123',
    'Qwertyuiop1!',
    'Q1w2e3r4t5!',
    'Welcome123!',
    'Welcome@123',
    'Welcome1234!',
    'Admin@12345',
    'Admin123!@#',
    'Administrator1!',
    'Abcd@12345',
    'Abc123456!',
    'Abcdef123!',
    'Aa123456789!',
    'Letmein123!',
    'Iloveyou123!',
    'Sunshine123!',
    'Football123!',
    'Monkey12345!',
    'Dragon12345!',
    'Princess123!',
    'Baseball123!',
    'Superman123!',
    'Trustno1234!',
    'Master12345!',
    'Shadow12345!',
    'Michael123!',
    'Changeme123!',
    'Test@12345',
    'Test123456!',
    'User@12345',
    'Login@12345',
    'Hello@12345',
    'Summer2026!',
    'Winter2026!',
    'Spring2026!',
    'Autumn2026!',
    'Company123!',
    'Zaq12wsx!@',
    '1qaz@WSX3edc',
    '1Qaz2wsx!',
  ].map((password) => password.toLowerCase()),
);

// Returns a message for the first password problem, or null when the password is strong enough
export function validatePassword(password: string): string | null {
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  const missing = RULES.filter((rule) => !rule.test(password)).map((rule) => rule.missing);
  if (missing.length > 0) return `Password must include: ${missing.join(', ')}.`;
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return COMMON_PASSWORD_MESSAGE;
  return null;
}

// Returns the first problem as a message for the user, or null when everything is valid
export function validateSignUp(username: string, password: string, confirm: string): string | null {
  if (!USERNAME_PATTERN.test(username)) return USERNAME_RULE_MESSAGE;
  const passwordProblem = validatePassword(password);
  if (passwordProblem) return passwordProblem;
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}
