/**
 * Invoice Document Database Queries
 *
 * Invoice-specific file attachments (separate from supplier_documents).
 */

import { supabaseAdmin } from '../lib/supabase.js';
import type { Database } from '../types/supabase.js';

type DocRow = Database['public']['Tables']['invoice_documents']['Row'];
type DocInsert = Database['public']['Tables']['invoice_documents']['Insert'];

const supabase = supabaseAdmin();

export type { DocRow as InvoiceDocumentRow };

export async function findDocumentsByInvoiceId(
  invoiceId: string,
  organizationId: string,
): Promise<DocRow[]> {
  const { data, error } = await supabase
    .from('invoice_documents')
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as DocRow[];
}

export async function createDocument(data: DocInsert): Promise<DocRow> {
  const { data: doc, error } = await supabase
    .from('invoice_documents')
    .insert(data as never)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return doc as DocRow;
}
