import { supabaseAdmin } from '../../../lib/supabase.ts';
import { validateUpdateRendicionRut } from '../../../db/schemas/rendicion.schema.ts';

export async function updateUserRut(userId: string, data: unknown): Promise<unknown> {
  const { rut } = validateUpdateRendicionRut(data);
  const db = supabaseAdmin();
  const { data: user, error: findError } = await db
    .from('users').select('rut').eq('id', userId).is('deleted_at', null).single();
  if (findError) throw new Error(`Database error: ${findError.message}`);
  if ((user as { rut: string | null })?.rut) throw new Error('RUT already set and cannot be changed');
  const { data: updated, error } = await db
    .from('users').update({ rut } as never).eq('id', userId).is('deleted_at', null).select().single();
  if (error) throw new Error(`Database error: ${error.message}`);
  return updated;
}
