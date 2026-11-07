import 'server-only';
import { auth } from '@/auth';

// Internal ID (`users.id`) of the signed-in user, or undefined for a session without one
// (for example a session created before the ID was stored)
export async function currentUserId(): Promise<string | undefined> {
  const session = await auth();
  return session?.user?.id || undefined;
}
