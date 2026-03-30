/**
 * Supplier Cost Center Database Queries (Edge Function)
 */

import { supabase } from '../lib/supabase.ts';

export type DistributionType = 'single' | 'average' | 'percentage' | 'manual';

export interface SupplierCostCenterRow {
  id: string;
  supplier_id: string;
  organization_id: string;
  cost_center_id: string;
  distribution_type: DistributionType;
  percentage: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  cost_center_name: string;
  cost_center_external_id: string;
}

export interface CreateSupplierCostCenterData {
  supplier_id: string;
  organization_id: string;
  cost_center_id: string;
  distribution_type: DistributionType;
  percentage: number | null;
  sort_order: number;
}

export async function findAllBySupplierAndOrg(
  supplierId: string,
  organizationId: string,
): Promise<SupplierCostCenterRow[]> {
  const { data, error } = await supabase
    .from('supplier_cost_centers' as never)
    .select(`
      id,
      supplier_id,
      organization_id,
      cost_center_id,
      distribution_type,
      percentage,
      sort_order,
      created_at,
      updated_at,
      deleted_at,
      cost_centers!inner(name, external_id)
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
    cost_center_id: string;
    distribution_type: DistributionType;
    percentage: number | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    cost_centers: { name: string; external_id: string };
  }>).map((row) => ({
    ...row,
    cost_center_name: row.cost_centers.name,
    cost_center_external_id: row.cost_centers.external_id,
  }));
}

export async function replaceAll(
  supplierId: string,
  organizationId: string,
  rows: CreateSupplierCostCenterData[],
): Promise<SupplierCostCenterRow[]> {
  const { error: deleteError } = await supabase
    .from('supplier_cost_centers' as never)
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('supplier_id', supplierId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (deleteError) throw new Error(`Database error: ${deleteError.message}`);

  if (rows.length === 0) return [];

  const { error: insertError } = await supabase
    .from('supplier_cost_centers' as never)
    .insert(rows as never);

  if (insertError) throw new Error(`Database error: ${insertError.message}`);

  return findAllBySupplierAndOrg(supplierId, organizationId);
}

export async function softDeleteById(
  id: string,
  organizationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('supplier_cost_centers' as never)
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
    .from('supplier_cost_centers' as never)
    .select('supplier_id')
    .eq('organization_id', organizationId)
    .eq('distribution_type', 'manual')
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
  return [...new Set(((data ?? []) as Array<{ supplier_id: string }>).map((r) => r.supplier_id))];
}
