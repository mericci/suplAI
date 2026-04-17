/**
 * Invoice Comment Database Queries
 */

import { supabaseAdmin } from '../lib/supabase.js';
import type { Database } from '../types/supabase.js';

type CommentRow = Database['public']['Tables']['invoice_comments']['Row'];
type CommentInsert = Database['public']['Tables']['invoice_comments']['Insert'];

const supabase = supabaseAdmin();

export type { CommentRow as InvoiceCommentRow };

export async function findCommentsByInvoiceId(
  invoiceId: string,
  organizationId: string,
): Promise<CommentRow[]> {
  const { data, error } = await supabase
    .from('invoice_comments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as CommentRow[];
}

export async function countCommentsByInvoiceId(
  invoiceId: string,
  organizationId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('invoice_comments')
    .select('id', { count: 'exact', head: true })
    .eq('invoice_id', invoiceId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
  return count ?? 0;
}

export async function createComment(data: CommentInsert): Promise<CommentRow> {
  const { data: comment, error } = await supabase
    .from('invoice_comments')
    .insert(data as never)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return comment as CommentRow;
}
