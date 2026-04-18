import { supabaseAdmin } from '../lib/supabase.ts';
import type { Database } from '../types/supabase.ts';

type RendicionDocumentRow = Database['public']['Tables']['rendicion_documents']['Row'];
type CreateInput = Database['public']['Tables']['rendicion_documents']['Insert'];
type UpdateInput = Database['public']['Tables']['rendicion_documents']['Update'];

const db = supabaseAdmin();

export async function findAllByRendicion(rendicionId: string): Promise<RendicionDocumentRow[]> {
  const { data, error } = await db
    .from('rendicion_documents')
    .select('*')
    .eq('rendicion_id', rendicionId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as RendicionDocumentRow[];
}

export async function findById(id: string): Promise<RendicionDocumentRow | null> {
  const { data, error } = await db
    .from('rendicion_documents')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data as RendicionDocumentRow;
}

export async function create(data: CreateInput): Promise<RendicionDocumentRow> {
  const { data: created, error } = await db
    .from('rendicion_documents')
    .insert(data as never)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return created as RendicionDocumentRow;
}

export async function update(
  id: string,
  updates: UpdateInput,
): Promise<RendicionDocumentRow> {
  const { data, error } = await db
    .from('rendicion_documents')
    .update({ ...updates, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return data as RendicionDocumentRow;
}

export async function softDelete(id: string): Promise<void> {
  const { error } = await db
    .from('rendicion_documents')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}

export async function computeTotalAmount(rendicionId: string): Promise<number> {
  const docs = await findAllByRendicion(rendicionId);
  return docs.reduce((sum, doc) => {
    const amount = doc.corrected_amount ?? doc.amount ?? 0;
    return sum + Number(amount);
  }, 0);
}

export async function checkDuplicate(
  organizationId: string,
  hash: string,
): Promise<boolean> {
  const { data, error } = await db
    .from('rendicion_documents')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('ai_validation_notes', `hash:${hash}`)
    .is('deleted_at', null)
    .limit(1);

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data?.length ?? 0) > 0;
}
