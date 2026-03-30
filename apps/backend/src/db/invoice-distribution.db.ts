/**
 * Invoice Distribution Database Queries
 *
 * Data access for invoice_cost_center_distributions and invoice_accounting_id_distributions.
 * No soft delete — distributions are immutable once created.
 */

import { supabase } from '../lib/supabase.js';

export interface InvoiceCostCenterDistributionRow {
  id: string;
  invoice_id: string;
  cost_center_id: string;
  organization_id: string;
  amount: number;
  percentage: number | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceAccountingIdDistributionRow {
  id: string;
  invoice_id: string;
  accounting_id: string;
  organization_id: string;
  amount: number;
  percentage: number | null;
  created_at: string;
  updated_at: string;
}

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

/**
 * Check if an invoice already has cost center distribution records.
 */
export async function hasCostCenterDistributions(invoiceId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('invoice_cost_center_distributions' as never)
    .select('id', { count: 'exact', head: true })
    .eq('invoice_id', invoiceId);

  if (error) throw new Error(`Database error: ${error.message}`);
  return (count ?? 0) > 0;
}

/**
 * Check if an invoice already has accounting ID distribution records.
 */
export async function hasAccountingIdDistributions(invoiceId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('invoice_accounting_id_distributions' as never)
    .select('id', { count: 'exact', head: true })
    .eq('invoice_id', invoiceId);

  if (error) throw new Error(`Database error: ${error.message}`);
  return (count ?? 0) > 0;
}

/**
 * Insert cost center distribution rows for an invoice.
 */
export async function createCostCenterDistributions(
  rows: CreateCostCenterDistribution[],
): Promise<void> {
  const { error } = await supabase
    .from('invoice_cost_center_distributions' as never)
    .insert(rows as never);

  if (error) throw new Error(`Database error: ${error.message}`);
}

/**
 * Insert accounting ID distribution rows for an invoice.
 */
export async function createAccountingIdDistributions(
  rows: CreateAccountingIdDistribution[],
): Promise<void> {
  const { error } = await supabase
    .from('invoice_accounting_id_distributions' as never)
    .insert(rows as never);

  if (error) throw new Error(`Database error: ${error.message}`);
}

/**
 * Get all invoice IDs (for given org + supplier IDs) that already have
 * cost center distributions.
 */
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

/**
 * Get all invoice IDs that already have accounting ID distributions.
 */
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
