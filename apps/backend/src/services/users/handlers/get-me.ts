import { findByEmail } from '../../../db/user.db.js';
import type { Database } from '../../../types/supabase.js';

type User = Database['public']['Tables']['users']['Row'];

export async function getMe({
  email,
}: {
  email: string;
}): Promise<User | null> {
  return findByEmail(email);
}
