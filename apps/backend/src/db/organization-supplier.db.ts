/**
 * Organization-Supplier Junction Database Queries
 *
 * Data access layer for the organization_suppliers junction table.
 * Tracks which suppliers are associated with each organization through invoice sync.
 */

import { supabaseAdmin } from '../lib/supabase.js';

interface OrganizationSupplierRow {
  organization_id: string;
  supplier_id: string;
  created_at: string;
}

/**
 * Find a junction row by organization and supplier IDs.
 */
export async function findByOrgAndSupplier(
  organizationId: string,
  supplierId: string,
): Promise<OrganizationSupplierRow | null> {
  const { data, error } = await (supabaseAdmin() as any)
    .from('organization_suppliers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('supplier_id', supplierId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data as OrganizationSupplierRow;
}

/**
 * Create a new organization-supplier junction row.
 */
export async function create(
  organizationId: string,
  supplierId: string,
): Promise<OrganizationSupplierRow> {
  const { data, error } = await (supabaseAdmin() as any)
    .from('organization_suppliers')
    .insert({ organization_id: organizationId, supplier_id: supplierId })
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return data as OrganizationSupplierRow;
}
