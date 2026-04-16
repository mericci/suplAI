/**
 * Invoice Event Database Queries
 *
 * Audit trail for invoice lifecycle transitions.
 */

import { supabaseAdmin } from '../lib/supabase.js';
import type { Database } from '../types/supabase.js';

type EventRow = Database['public']['Tables']['invoice_events']['Row'];
type EventInsert = Database['public']['Tables']['invoice_events']['Insert'];

const supabase = supabaseAdmin();

export type { EventRow as InvoiceEventRow };

export type InvoiceEventType =
  | 'created'
  | 'ai_validated'
  | 'approved'
  | 'rejected'
  | 'nomina_associated'
  | 'paid';

export async function findEventsByInvoiceId(
  invoiceId: string,
  organizationId: string,
): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from('invoice_events')
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('organization_id', organizationId)
    .order('occurred_at', { ascending: true });

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as EventRow[];
}

export async function createEvent(data: EventInsert): Promise<EventRow> {
  const { data: event, error } = await supabase
    .from('invoice_events')
    .insert(data as never)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return event as EventRow;
}

export async function createEvents(rows: EventInsert[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from('invoice_events')
    .insert(rows as never);

  if (error) throw new Error(`Database error: ${error.message}`);
}
