/**
 * Invoice Comment Database Queries (Edge Function)
 */

import { supabase } from '../lib/supabase.ts';

export interface InvoiceCommentRow {
  id: string;
  invoice_id: string;
  organization_id: string;
  user_id: string | null;
  content: string;
  type: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export async function findCommentsByInvoiceId(
  invoiceId: string,
  organizationId: string,
): Promise<InvoiceCommentRow[]> {
  const { data, error } = await supabase
    .from('invoice_comments' as never)
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as InvoiceCommentRow[];
}

export async function countCommentsByInvoiceId(
  invoiceId: string,
  organizationId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('invoice_comments' as never)
    .select('id', { count: 'exact', head: true })
    .eq('invoice_id', invoiceId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
  return count ?? 0;
}

export async function createComment(data: Omit<InvoiceCommentRow, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<InvoiceCommentRow> {
  const { data: comment, error } = await supabase
    .from('invoice_comments' as never)
    .insert(data as never)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return comment as InvoiceCommentRow;
}
