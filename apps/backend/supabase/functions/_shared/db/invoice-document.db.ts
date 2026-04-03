/**
 * Invoice Document Database Queries (Edge Function)
 */

import { supabase } from '../lib/supabase.ts';

export interface InvoiceDocumentRow {
  id: string;
  invoice_id: string;
  organization_id: string;
  file_name: string;
  storage_path: string;
  storage_bucket: string;
  description: string | null;
  uploaded_by_user_id: string | null;
  created_at: string;
  deleted_at: string | null;
}

export async function findDocumentsByInvoiceId(
  invoiceId: string,
  organizationId: string,
): Promise<InvoiceDocumentRow[]> {
  const { data, error } = await supabase
    .from('invoice_documents' as never)
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as InvoiceDocumentRow[];
}

export async function createDocument(data: Omit<InvoiceDocumentRow, 'id' | 'created_at' | 'deleted_at'>): Promise<InvoiceDocumentRow> {
  const { data: doc, error } = await supabase
    .from('invoice_documents' as never)
    .insert(data as never)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return doc as InvoiceDocumentRow;
}
