/**
 * Supplier Database Queries
 *
 * Data access layer for global supplier operations.
 * Suppliers are shared across organizations — deduplicated by tax_identifier.
 * All queries filter by deleted_at IS NULL (soft delete pattern).
 */

import { supabase, supabaseAdmin } from '../lib/supabase.ts';
import type { Database } from '../types/supabase.ts';
import { normalizeRut, formatRut } from '../utils/rut.ts';

type Supplier = Database['public']['Tables']['suppliers']['Row'];
type CreateSupplierInput = Database['public']['Tables']['suppliers']['Insert'];
type UpdateSupplierInput = Database['public']['Tables']['suppliers']['Update'];

export type SupplierWithAmounts = Supplier & {
  totalInvoiceAmount: number;
  totalApprovedAmount: number;
};

/**
 * Find an active supplier by ID.
 */
export async function findById(id: string): Promise<Supplier | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}

/**
 * Find an active supplier by tax identifier.
 */
export async function findByTaxIdentifier(
  taxIdentifier: string,
): Promise<Supplier | null> {
  const normalized = normalizeRut(taxIdentifier);
  const formatted = formatRut(taxIdentifier);
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .or(`tax_identifier.eq.${normalized},tax_identifier.eq.${formatted}`)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}

/**
 * Create a new supplier.
 */
export async function create(data: CreateSupplierInput): Promise<Supplier> {
  const { data: supplier, error } = await supabase
    .from('suppliers')
    .insert(data as never)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return supplier as Supplier;
}

/**
 * Update a supplier by ID.
 */
export async function update(
  id: string,
  data: UpdateSupplierInput,
): Promise<Supplier> {
  const { data: supplier, error } = await supabase
    .from('suppliers')
    .update(data as never)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return supplier as Supplier;
}

/**
 * Soft-delete a supplier by ID.
 */
export async function softDeleteById(id: string): Promise<void> {
  const { error } = await supabase
    .from('suppliers')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}

/**
 * List active suppliers linked to a specific organization via the junction table.
 * Includes per-supplier invoice amount aggregates for the given org.
 */
export async function findByOrganization(
  organizationId: string,
  limit: number,
  offset: number,
  search?: string,
): Promise<{ suppliers: SupplierWithAmounts[]; total: number }> {
  // Step 1: Fetch supplier IDs linked to this org from the junction table
  const { data: junctionRows, error: junctionError } = await supabaseAdmin()
    .from('organization_suppliers')
    .select('supplier_id')
    .eq('organization_id', organizationId);

  if (junctionError) throw new Error(`Database error: ${junctionError.message}`);

  const supplierIds = ((junctionRows ?? []) as { supplier_id: string }[]).map(
    (row) => row.supplier_id,
  );

  if (supplierIds.length === 0) return { suppliers: [], total: 0 };

  // Step 2: Query suppliers filtered by those IDs, with optional search
  let countQuery = supabase
    .from('suppliers')
    .select('*', { count: 'exact', head: true })
    .in('id', supplierIds)
    .is('deleted_at', null);

  let dataQuery = supabase
    .from('suppliers')
    .select('*')
    .in('id', supplierIds)
    .is('deleted_at', null);

  if (search) {
    const pattern = `%${search}%`;
    countQuery = countQuery.or(
      `legal_name.ilike.${pattern},tax_identifier.ilike.${pattern}`,
    );
    dataQuery = dataQuery.or(
      `legal_name.ilike.${pattern},tax_identifier.ilike.${pattern}`,
    );
  }

  const { count, error: countError } = await countQuery;
  if (countError) throw new Error(`Database error: ${countError.message}`);

  const { data, error } = await dataQuery
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Database error: ${error.message}`);

  // Step 3: Aggregate invoice amounts per supplier for this page
  const pageSupplierIds = (data ?? []).map((s) => s.id);
  let totals: Record<string, { total: number; approved: number }> = {};

  if (pageSupplierIds.length > 0) {
    const { data: amountRows, error: amountError } = await (supabase as any)
      .from('invoices')
      .select('supplier_id, gross_amount, status')
      .eq('organization_id', organizationId)
      .in('supplier_id', pageSupplierIds)
      .in('status', ['pending', 'approved', 'paid'])
      .is('deleted_at', null);

    if (amountError) throw new Error(`Database error: ${amountError.message}`);

    totals = ((amountRows ?? []) as {
      supplier_id: string;
      gross_amount: number | null;
      status: string;
    }[]).reduce<Record<string, { total: number; approved: number }>>(
      (acc, row) => {
        if (!acc[row.supplier_id]) acc[row.supplier_id] = { total: 0, approved: 0 };
        acc[row.supplier_id].total += row.gross_amount ?? 0;
        if (row.status === 'approved' || row.status === 'paid') {
          acc[row.supplier_id].approved += row.gross_amount ?? 0;
        }
        return acc;
      },
      {},
    );
  }

  const suppliers: SupplierWithAmounts[] = (data ?? []).map((s) => ({
    ...s,
    totalInvoiceAmount: totals[s.id]?.total ?? 0,
    totalApprovedAmount: totals[s.id]?.approved ?? 0,
  }));

  return { suppliers, total: count ?? 0 };
}

/**
 * List active suppliers with optional search, exact taxIdentifier filter, and pagination.
 */
export async function findAll(
  limit: number,
  offset: number,
  search?: string,
  taxIdentifier?: string,
): Promise<{ suppliers: Supplier[]; total: number }> {
  let countQuery = supabase
    .from('suppliers')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  let dataQuery = supabase.from('suppliers').select('*').is('deleted_at', null);

  if (taxIdentifier) {
    const normalized = normalizeRut(taxIdentifier);
    const formatted = formatRut(taxIdentifier);
    const filter = `tax_identifier.eq.${normalized},tax_identifier.eq.${formatted}`;
    countQuery = countQuery.or(filter);
    dataQuery = dataQuery.or(filter);
  } else if (search) {
    const pattern = `%${search}%`;
    countQuery = countQuery.or(
      `legal_name.ilike.${pattern},tax_identifier.ilike.${pattern}`,
    );
    dataQuery = dataQuery.or(
      `legal_name.ilike.${pattern},tax_identifier.ilike.${pattern}`,
    );
  }

  const { count, error: countError } = await countQuery;
  if (countError) throw new Error(`Database error: ${countError.message}`);

  const { data, error } = await dataQuery
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Database error: ${error.message}`);

  return {
    suppliers: data ?? [],
    total: count ?? 0,
  };
}
