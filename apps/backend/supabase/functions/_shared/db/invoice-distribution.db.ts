/**
 * Invoice Distribution Database Queries (Edge Function)
 */

import { supabase } from '../lib/supabase.ts';

export interface CreateCostCenterDistribution {
  invoice_id: string;
  cost_center_id: string;
  organization_id: string;
  amount: number;
  percentage?: number | null;
}

export interface CreateAccountingIdDistribution {
  invoice_id: string;
  accounting_id: string;
  organization_id: string;
  amount: number;
  percentage?: number | null;
}

export async function hasCostCenterDistributions(invoiceId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('invoice_cost_center_distributions' as never)
    .select('id', { count: 'exact', head: true })
    .eq('invoice_id', invoiceId);

  if (error) throw new Error(`Database error: ${error.message}`);
  return (count ?? 0) > 0;
}

export async function hasAccountingIdDistributions(invoiceId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('invoice_accounting_id_distributions' as never)
    .select('id', { count: 'exact', head: true })
    .eq('invoice_id', invoiceId);

  if (error) throw new Error(`Database error: ${error.message}`);
  return (count ?? 0) > 0;
}

export async function createCostCenterDistributions(
  rows: CreateCostCenterDistribution[],
): Promise<void> {
  const { error } = await supabase
    .from('invoice_cost_center_distributions' as never)
    .insert(rows as never);

  if (error) throw new Error(`Database error: ${error.message}`);
}

export async function createAccountingIdDistributions(
  rows: CreateAccountingIdDistribution[],
): Promise<void> {
  const { error } = await supabase
    .from('invoice_accounting_id_distributions' as never)
    .insert(rows as never);

  if (error) throw new Error(`Database error: ${error.message}`);
}

export async function getInvoiceIdsWithCostCenterDistributions(
  organizationId: string,
  invoiceIds: string[],
): Promise<Set<string>> {
  if (invoiceIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from('invoice_cost_center_distributions' as never)
    .select('invoice_id')
    .eq('organization_id', organizationId)
    .in('invoice_id', invoiceIds);

  if (error) throw new Error(`Database error: ${error.message}`);
  return new Set(((data ?? []) as Array<{ invoice_id: string }>).map((r) => r.invoice_id));
}

export async function getInvoiceIdsWithAccountingIdDistributions(
  organizationId: string,
  invoiceIds: string[],
): Promise<Set<string>> {
  if (invoiceIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from('invoice_accounting_id_distributions' as never)
    .select('invoice_id')
    .eq('organization_id', organizationId)
    .in('invoice_id', invoiceIds);

  if (error) throw new Error(`Database error: ${error.message}`);
  return new Set(((data ?? []) as Array<{ invoice_id: string }>).map((r) => r.invoice_id));
}
