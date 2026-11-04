import type { Client, ClientField, ClientFormValues } from './client-details';

// Light format checks for values the user types (ARCHITECTURE ADR-27, ADR-28). The backend enforces the
// same rules in common/validation/contact.ts; here they give a message next to the field.

const PHONE = /^[\d\s+\-()]+$/;
const MIN_PHONE_DIGITS = 7;

const EMAIL_LOCAL = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/i;
const EMAIL_DOMAIN = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
const MAX_EMAIL_LENGTH = 254;
const MAX_EMAIL_LOCAL_LENGTH = 64;

// Mistyped domains of common mail providers. A general ".co" check is not possible, because many
// real companies use it, so ".co" is only caught for these providers.
const DOMAIN_TYPOS: Record<string, string> = {
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmail.co.il': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmail.cm': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.cm': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'outlook.co': 'outlook.com',
  'outlook.cm': 'outlook.com',
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'icloud.co': 'icloud.com',
  'icloud.cm': 'icloud.com',
  'iclod.com': 'icloud.com',
  'walla.co': 'walla.co.il',
};

// Endings that are not real and are almost always a mistyped ".com"
const COM_TYPOS = /\.(con|cmo|ocm|vom|xom|comm|coom)$/i;

// Returns the likely intended address when the domain is a known typo, otherwise null
export function suggestEmail(value: string): string | null {
  const email = value.trim();
  const at = email.lastIndexOf('@');
  if (at < 1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();
  const corrected =
    DOMAIN_TYPOS[domain] ?? (COM_TYPOS.test(domain) ? domain.replace(COM_TYPOS, '.com') : null);
  return corrected ? `${local}@${corrected}` : null;
}

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  const at = email.lastIndexOf('@');
  if (at < 1 || email.length > MAX_EMAIL_LENGTH || at > MAX_EMAIL_LOCAL_LENGTH) return false;
  return (
    EMAIL_LOCAL.test(email.slice(0, at)) &&
    EMAIL_DOMAIN.test(email.slice(at + 1)) &&
    suggestEmail(email) === null
  );
}

export const INVALID_EMAIL = 'Enter a valid email address.';
export const INVALID_PHONE = 'Enter a valid phone number.';

export type FieldErrors = Partial<Record<ClientField, string>>;

export function isValidPhone(value: string): boolean {
  const phone = value.trim();
  return PHONE.test(phone) && phone.replace(/\D/g, '').length >= MIN_PHONE_DIGITS;
}

// Only a changed, non-empty value is checked, so an old value never blocks other edits
export function validateContactFields(values: ClientFormValues, client: Client): FieldErrors {
  const errors: FieldErrors = {};
  const changed = (field: 'email' | 'phone') =>
    values[field].trim() !== '' && values[field] !== (client[field] ?? '');

  if (changed('email') && !isValidEmail(values.email)) {
    const suggestion = suggestEmail(values.email);
    errors.email = suggestion ? `Did you mean ${suggestion}?` : INVALID_EMAIL;
  }
  if (changed('phone') && !isValidPhone(values.phone)) errors.phone = INVALID_PHONE;
  return errors;
}
