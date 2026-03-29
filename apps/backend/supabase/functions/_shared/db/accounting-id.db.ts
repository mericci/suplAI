/**
 * Accounting ID Database Queries (Edge Function)
 */

import { supabase } from '../lib/supabase.ts';

export interface AccountingIdRow {
  id: string;
  organization_id: string;
  external_id: string;
  description: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateAccountingIdData {
  organization_id: string;
  external_id: string;
  description: string;
}

export interface UpdateAccountingIdData {
  external_id?: string;
  description?: string;
}

export async function findAllByOrganization(
  organizationId: string,
): Promise<AccountingIdRow[]> {
  const { data, error } = await supabase
    .from('accounting_ids' as never)
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as AccountingIdRow[];
}

export async function findById(
  id: string,
  organizationId: string,
): Promise<AccountingIdRow | null> {
  const { data, error } = await supabase
    .from('accounting_ids' as never)
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data as AccountingIdRow;
}

export async function create(data: CreateAccountingIdData): Promise<AccountingIdRow> {
  const { data: row, error } = await supabase
    .from('accounting_ids' as never)
    .insert(data as never)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return row as AccountingIdRow;
}

export async function update(
  id: string,
  organizationId: string,
  data: UpdateAccountingIdData,
): Promise<AccountingIdRow> {
  const { data: row, error } = await supabase
    .from('accounting_ids' as never)
    .update({ ...data, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return row as AccountingIdRow;
}

export async function softDeleteById(
  id: string,
  organizationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('accounting_ids' as never)
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}
