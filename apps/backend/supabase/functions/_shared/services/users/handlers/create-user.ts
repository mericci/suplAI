import { createUser as createUserAction } from '../actions/create-user.ts';
import type { Database } from '../../../types/supabase.ts';

type User = Database['public']['Tables']['users']['Row'];

export function createUser(
  organizationId: string,
  userData: unknown,
): Promise<User> {
  return createUserAction(organizationId, userData);
}
