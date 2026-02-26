import { getUser as getUserAction } from '../actions/get-user.js';
import type { UserSearchParams } from '../actions/get-user.js';
import type { Database } from '../../../types/supabase.js';

type User = Database['public']['Tables']['users']['Row'];

export function getUser(params: UserSearchParams): Promise<User> {
  return getUserAction(params);
}
