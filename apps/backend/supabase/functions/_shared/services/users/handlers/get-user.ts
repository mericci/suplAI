import { getUser as getUserAction } from '../actions/get-user.ts';
import type { UserSearchParams } from '../actions/get-user.ts';
import type { Database } from '../../../types/supabase.ts';

type User = Database['public']['Tables']['users']['Row'];

export function getUser(params: UserSearchParams): Promise<User> {
  return getUserAction(params);
}
