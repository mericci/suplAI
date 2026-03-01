import { findByEmail } from '../../../db/user.db.ts';
import type { Database } from '../../../types/supabase.ts';

type User = Database['public']['Tables']['users']['Row'];

export async function getMe({
  email,
}: {
  email: string;
}): Promise<User | null> {
  return findByEmail(email);
}
