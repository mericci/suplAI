/**
 * Supplier Service Database Queries (Edge Function)
 */

import { supabaseAdmin } from '../lib/supabase.ts';

const supabase = supabaseAdmin();

export interface SupplierServiceRow {
  id: string;
  supplier_id: string;
  organization_id: string;
  service_category: string;
  service_description: string | null;
  cost_center_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateSupplierServiceData {
  supplier_id: string;
  organization_id: string;
  service_category: string;
  service_description?: string | null;
  cost_center_id?: string | null;
}

export async function create(data: CreateSupplierServiceData): Promise<SupplierServiceRow> {
  const { data: row, error } = await (supabase as any)
    .from('supplier_services')
    .insert({
      supplier_id: data.supplier_id,
      organization_id: data.organization_id,
      service_category: data.service_category,
      service_description: data.service_description ?? null,
      cost_center_id: data.cost_center_id ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return row as SupplierServiceRow;
}

export async function findBySupplierAndOrg(
  supplierId: string,
  orgId: string,
): Promise<SupplierServiceRow[]> {
  const { data, error } = await (supabase as any)
    .from('supplier_services')
    .select('*')
    .eq('supplier_id', supplierId)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as SupplierServiceRow[];
}

export async function findById(id: string): Promise<SupplierServiceRow | null> {
  const { data, error } = await (supabase as any)
    .from('supplier_services')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data as SupplierServiceRow;
}

export async function findCostCentersByServiceIds(
  serviceIds: string[],
): Promise<Map<string, string | null>> {
  if (serviceIds.length === 0) return new Map();
  const { data, error } = await (supabase as any)
    .from('supplier_services')
    .select('id, cost_center_id')
    .in('id', serviceIds)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
  const map = new Map<string, string | null>();
  for (const row of (data ?? []) as Array<{ id: string; cost_center_id: string | null }>) {
    map.set(row.id, row.cost_center_id);
  }
  return map;
}

export async function softDelete(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('supplier_services')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}
