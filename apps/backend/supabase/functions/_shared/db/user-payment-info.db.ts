import { supabaseAdmin } from '../lib/supabase.ts';
import type { Database } from '../types/supabase.ts';

type UserPaymentInfoRow = Database['public']['Tables']['user_payment_info']['Row'];
type CreateInput = Database['public']['Tables']['user_payment_info']['Insert'];
type UpdateInput = Database['public']['Tables']['user_payment_info']['Update'];

const db = supabaseAdmin();

export async function findAllByUser(userId: string): Promise<UserPaymentInfoRow[]> {
  const { data, error } = await db
    .from('user_payment_info')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as UserPaymentInfoRow[];
}

export async function findById(id: string): Promise<UserPaymentInfoRow | null> {
  const { data, error } = await db
    .from('user_payment_info')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data as UserPaymentInfoRow;
}

export async function findByIdAndUser(
  id: string,
  userId: string,
): Promise<UserPaymentInfoRow | null> {
  const { data, error } = await db
    .from('user_payment_info')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data as UserPaymentInfoRow;
}

export async function create(data: CreateInput): Promise<UserPaymentInfoRow> {
  const { data: created, error } = await db
    .from('user_payment_info')
    .insert(data as never)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return created as UserPaymentInfoRow;
}

export async function update(
  id: string,
  updates: UpdateInput,
): Promise<UserPaymentInfoRow> {
  const { data, error } = await db
    .from('user_payment_info')
    .update({ ...updates, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return data as UserPaymentInfoRow;
}

export async function clearDefaultForUser(userId: string): Promise<void> {
  const { error } = await db
    .from('user_payment_info')
    .update({ is_default: false, updated_at: new Date().toISOString() } as never)
    .eq('user_id', userId)
    .eq('is_default', true)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}

export async function softDelete(id: string): Promise<void> {
  const { error } = await db
    .from('user_payment_info')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}
