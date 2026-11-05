import { projectRefFromUrl } from '../database/dev-guard';

const TRANSACTION_POOLER_PORT = '6543';

// Checks the pasted connection string before anything connects (ARCHITECTURE section 21).
// Messages are shown to the user, so they never include the pasted value. Returns the project ID.
export function checkProductionTarget(pasted: string, devProjectRef: string | undefined): string {
  if (!pasted) throw new Error('Nothing was pasted.');
  if (pasted.includes('[YOUR-PASSWORD]') || pasted.includes('[YOUR_PASSWORD]')) {
    throw new Error('Replace [YOUR-PASSWORD] with the ordan-prod database password, then retry.');
  }
  if (!/^postgres(ql)?:\/\//.test(pasted) || !URL.canParse(pasted)) {
    throw new Error('This is not a valid connection string. It should start with postgresql://');
  }
  if (new URL(pasted).port === TRANSACTION_POOLER_PORT) {
    throw new Error('This is the Transaction pooler. Copy the Session pooler string instead.');
  }
  const ref = projectRefFromUrl(pasted);
  if (!ref) throw new Error('Could not find a Supabase project ID in this connection string.');
  if (!devProjectRef) {
    throw new Error('DATABASE_DEV_PROJECT_REF is missing, so Development cannot be ruled out.');
  }
  if (ref === devProjectRef) {
    throw new Error('This is the Development project (ordan-dev). Copy the ordan-prod string.');
  }
  return ref;
}

// Removes the connection string and its password from a message before it is printed
export function redactSecrets(message: string, connectionString: string): string {
  let safe = message.replaceAll(connectionString, '[connection string]');
  if (URL.canParse(connectionString)) {
    const { password } = new URL(connectionString);
    if (password) {
      safe = safe
        .replaceAll(password, '[password]')
        .replaceAll(decodeURIComponent(password), '[password]');
    }
  }
  return safe;
}
