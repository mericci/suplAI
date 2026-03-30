/**
 * Supplier Accounting ID Database Queries (Edge Function)
 */

import { supabase } from '../lib/supabase.ts';
import type { DistributionType } from './supplier-cost-center.db.ts';

export type { DistributionType };

export interface SupplierAccountingIdRow {
  id: string;
  supplier_id: string;
  organization_id: string;
  accounting_id: string;
  distribution_type: DistributionType;
  percentage: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  accounting_external_id: string;
  accounting_description: string;
}

export interface CreateSupplierAccountingIdData {
  supplier_id: string;
  organization_id: string;
  accounting_id: string;
  distribution_type: DistributionType;
  percentage: number | null;
  sort_order: number;
}

export async function findAllBySupplierAndOrg(
  supplierId: string,
  organizationId: string,
): Promise<SupplierAccountingIdRow[]> {
  const { data, error } = await supabase
    .from('supplier_accounting_ids' as never)
    .select(`
      id,
      supplier_id,
      organization_id,
      accounting_id,
      distribution_type,
      percentage,
      sort_order,
      created_at,
      updated_at,
      deleted_at,
      accounting_ids!inner(external_id, description)
    `)
    .eq('supplier_id', supplierId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Database error: ${error.message}`);

  return ((data ?? []) as Array<{
    id: string;
    supplier_id: string;
    organization_id: string;
    accounting_id: string;
    distribution_type: DistributionType;
    percentage: number | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    accounting_ids: { external_id: string; description: string };
  }>).map((row) => ({
    ...row,
    accounting_external_id: row.accounting_ids.external_id,
    accounting_description: row.accounting_ids.description,
  }));
}

export async function replaceAll(
  supplierId: string,
  organizationId: string,
  rows: CreateSupplierAccountingIdData[],
): Promise<SupplierAccountingIdRow[]> {
  const { error: deleteError } = await supabase
    .from('supplier_accounting_ids' as never)
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('supplier_id', supplierId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (deleteError) throw new Error(`Database error: ${deleteError.message}`);

  if (rows.length === 0) return [];

  const { error: insertError } = await supabase
    .from('supplier_accounting_ids' as never)
    .insert(rows as never);

  if (insertError) throw new Error(`Database error: ${insertError.message}`);

  return findAllBySupplierAndOrg(supplierId, organizationId);
}

export async function softDeleteById(
  id: string,
  organizationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('supplier_accounting_ids' as never)
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}

export async function findSuppliersWithManualDistribution(
  organizationId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('supplier_accounting_ids' as never)
    .select('supplier_id')
    .eq('organization_id', organizationId)
    .eq('distribution_type', 'manual')
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
  return [...new Set(((data ?? []) as Array<{ supplier_id: string }>).map((r) => r.supplier_id))];
}
