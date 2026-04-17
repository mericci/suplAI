/**
 * Nomina Database Queries (Edge Function)
 */

import { supabaseAdmin } from '../lib/supabase.ts';
import type { Database } from '../types/supabase.ts';

type NominaRow = Database['public']['Tables']['nominas']['Row'];
type NominaInsert = Database['public']['Tables']['nominas']['Insert'];
type NominaUpdate = Database['public']['Tables']['nominas']['Update'];

const supabase = supabaseAdmin();

export type { NominaRow, NominaInsert, NominaUpdate };

export async function findById(id: string, orgId: string): Promise<NominaRow | null> {
  const { data, error } = await (supabase as any)
    .from('nominas')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data as NominaRow;
}

export async function findAllByOrg(orgId: string): Promise<NominaRow[]> {
  const { data, error } = await (supabase as any)
    .from('nominas')
    .select('*')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as NominaRow[];
}

export async function findLockedInvoiceIds(orgId: string): Promise<string[]> {
  const { data: nominas, error: nominasError } = await (supabase as any)
    .from('nominas')
    .select('id')
    .eq('organization_id', orgId)
    .eq('status', 'pending')
    .is('deleted_at', null);

  if (nominasError) throw new Error(`Database error: ${nominasError.message}`);
  if (!nominas || nominas.length === 0) return [];

  const nominaIds = (nominas as Array<{ id: string }>).map((n) => n.id);

  const { data, error } = await (supabase as any)
    .from('nomina_invoices')
    .select('invoice_id')
    .in('nomina_id', nominaIds);

  if (error) throw new Error(`Database error: ${error.message}`);
  return ((data ?? []) as Array<{ invoice_id: string }>).map((row) => row.invoice_id);
}

export async function create(data: NominaInsert): Promise<NominaRow> {
  const { data: nomina, error } = await (supabase as any)
    .from('nominas')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return nomina as NominaRow;
}

export async function update(
  id: string,
  orgId: string,
  data: Partial<NominaUpdate>,
): Promise<NominaRow> {
  const { data: nomina, error } = await (supabase as any)
    .from('nominas')
    .update(data)
    .eq('id', id)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return nomina as NominaRow;
}

export async function softDelete(id: string, orgId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('nominas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', orgId)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}

export async function insertNominaInvoices(
  nominaId: string,
  invoiceIds: string[],
): Promise<void> {
  if (invoiceIds.length === 0) return;

  const rows = invoiceIds.map((invoiceId) => ({ nomina_id: nominaId, invoice_id: invoiceId }));

  const { error } = await (supabase as any)
    .from('nomina_invoices')
    .insert(rows);

  if (error) throw new Error(`Database error: ${error.message}`);
}

export async function findInvoiceIdsByNominaId(nominaId: string): Promise<string[]> {
  const { data, error } = await (supabase as any)
    .from('nomina_invoices')
    .select('invoice_id')
    .eq('nomina_id', nominaId);

  if (error) throw new Error(`Database error: ${error.message}`);
  return ((data ?? []) as Array<{ invoice_id: string }>).map((row) => row.invoice_id);
}

export async function replaceNominaInvoices(
  nominaId: string,
  orgId: string,
  newInvoiceIds: string[],
  newTotalAmount: number,
): Promise<NominaRow> {
  const { error: deleteError } = await (supabase as any)
    .from('nomina_invoices')
    .delete()
    .eq('nomina_id', nominaId);

  if (deleteError) throw new Error(`Database error: ${deleteError.message}`);

  await insertNominaInvoices(nominaId, newInvoiceIds);

  return update(nominaId, orgId, {
    total_amount: newTotalAmount,
    invoice_count: newInvoiceIds.length,
  });
}

export async function findNominaByInvoiceId(
  invoiceId: string,
  orgId: string,
): Promise<NominaRow | null> {
  const { data: links, error: linkError } = await (supabase as any)
    .from('nomina_invoices')
    .select('nomina_id')
    .eq('invoice_id', invoiceId);

  if (linkError) throw new Error(`Database error: ${linkError.message}`);
  if (!links || links.length === 0) return null;

  const nominaIds = (links as Array<{ nomina_id: string }>).map((l) => l.nomina_id);

  const { data, error } = await (supabase as any)
    .from('nominas')
    .select('*')
    .in('id', nominaIds)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data as NominaRow;
}
