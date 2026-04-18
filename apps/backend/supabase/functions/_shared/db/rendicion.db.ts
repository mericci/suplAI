import { supabaseAdmin } from '../lib/supabase.ts';
import type { Database } from '../types/supabase.ts';

type RendicionRow = Database['public']['Tables']['rendiciones']['Row'];
type CreateInput = Database['public']['Tables']['rendiciones']['Insert'];
type UpdateInput = Database['public']['Tables']['rendiciones']['Update'];

const db = supabaseAdmin();

export async function findById(id: string): Promise<RendicionRow | null> {
  const { data, error } = await db
    .from('rendiciones')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data as RendicionRow;
}

export async function findByIdAndOrg(
  id: string,
  organizationId: string,
): Promise<RendicionRow | null> {
  const { data, error } = await db
    .from('rendiciones')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data as RendicionRow;
}

export interface ListRendicionesFilters {
  organizationId: string;
  userId?: string;
  status?: string;
  limit: number;
  offset: number;
}

export async function findAll(
  filters: ListRendicionesFilters,
): Promise<{ rendiciones: RendicionRow[]; total: number }> {
  let countQuery = db
    .from('rendiciones')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', filters.organizationId)
    .is('deleted_at', null);

  let dataQuery = db
    .from('rendiciones')
    .select('*')
    .eq('organization_id', filters.organizationId)
    .is('deleted_at', null);

  if (filters.userId) {
    countQuery = countQuery.eq('created_by_user_id', filters.userId);
    dataQuery = dataQuery.eq('created_by_user_id', filters.userId);
  }

  if (filters.status) {
    countQuery = countQuery.eq('status', filters.status);
    dataQuery = dataQuery.eq('status', filters.status);
  }

  const { count, error: countError } = await countQuery;
  if (countError) throw new Error(`Database error: ${countError.message}`);

  const { data, error } = await dataQuery
    .range(filters.offset, filters.offset + filters.limit - 1)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Database error: ${error.message}`);

  return {
    rendiciones: (data ?? []) as RendicionRow[],
    total: count ?? 0,
  };
}

export async function create(data: CreateInput): Promise<RendicionRow> {
  const { data: created, error } = await db
    .from('rendiciones')
    .insert(data as never)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return created as RendicionRow;
}

export async function update(
  id: string,
  updates: UpdateInput,
): Promise<RendicionRow> {
  const { data, error } = await db
    .from('rendiciones')
    .update({ ...updates, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return data as RendicionRow;
}

export async function softDelete(id: string): Promise<void> {
  const { error } = await db
    .from('rendiciones')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}
