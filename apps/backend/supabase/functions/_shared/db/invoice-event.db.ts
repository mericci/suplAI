/**
 * Invoice Event Database Queries (Edge Function)
 */

import { supabase } from '../lib/supabase.ts';

export interface InvoiceEventRow {
  id: string;
  invoice_id: string;
  organization_id: string;
  event_type: string;
  actor_user_id: string | null;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
}

export async function findEventsByInvoiceId(
  invoiceId: string,
  organizationId: string,
): Promise<InvoiceEventRow[]> {
  const { data, error } = await supabase
    .from('invoice_events' as never)
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('organization_id', organizationId)
    .order('occurred_at', { ascending: true });

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as InvoiceEventRow[];
}

export async function createEvent(data: Omit<InvoiceEventRow, 'id'>): Promise<InvoiceEventRow> {
  const { data: event, error } = await supabase
    .from('invoice_events' as never)
    .insert(data as never)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return event as InvoiceEventRow;
}

export async function createEvents(rows: Omit<InvoiceEventRow, 'id'>[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from('invoice_events' as never)
    .insert(rows as never);

  if (error) throw new Error(`Database error: ${error.message}`);
}
