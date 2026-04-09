/**
 * Supplier Service Database Queries
 *
 * Data access layer for supplier_services records (org-scoped).
 * All queries filter by deleted_at IS NULL (soft delete pattern).
 */

import { supabase } from '../lib/supabase.js';

// supplier_services is not yet in the Supabase-generated Database type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface SupplierServiceRow {
  id: string;
  supplier_id: string;
  organization_id: string;
  service_category: string;
  service_description: string | null;
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
}

/**
 * Create a new supplier service record.
 */
export async function create(data: CreateSupplierServiceData): Promise<SupplierServiceRow> {
  const { data: row, error } = await db
    .from('supplier_services')
    .insert({
      supplier_id: data.supplier_id,
      organization_id: data.organization_id,
      service_category: data.service_category,
      service_description: data.service_description ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return row as SupplierServiceRow;
}

/**
 * List all active services for a supplier within an organization.
 */
export async function findBySupplierAndOrg(
  supplierId: string,
  orgId: string,
): Promise<SupplierServiceRow[]> {
  const { data, error } = await db
    .from('supplier_services')
    .select('*')
    .eq('supplier_id', supplierId)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as SupplierServiceRow[];
}

/**
 * Find a single active supplier service by ID.
 */
export async function findById(id: string): Promise<SupplierServiceRow | null> {
  const { data, error } = await db
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

/**
 * Soft-delete a supplier service by ID.
 */
export async function softDelete(id: string): Promise<void> {
  const { error } = await db
    .from('supplier_services')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}
