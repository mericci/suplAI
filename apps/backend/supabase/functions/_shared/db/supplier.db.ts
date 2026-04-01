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
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  totalInvoiceAmount: number;
  totalApprovedAmount: number;
  respaldoType: 'none' | 'manual_insight' | 'validated_document';
};

function deriveRespaldoType(
  docs: { document_role: string | null }[],
): 'none' | 'manual_insight' | 'validated_document' {
  if (docs.length === 0) return 'none';
  if (docs.some((d) => d.document_role === 'cost_contract')) return 'validated_document';
  return 'manual_insight';
}

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
  sortBy?: string,
  sortDir?: 'asc' | 'desc',
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

  const validSortColumns = ['legal_name', 'tax_identifier', 'created_at'];
  const orderedQuery = sortBy && validSortColumns.includes(sortBy)
    ? dataQuery.range(offset, offset + limit - 1).order(sortBy, { ascending: sortDir === 'asc' })
    : dataQuery.range(offset, offset + limit - 1).order('created_at', { ascending: false });

  const { data, error } = await orderedQuery;

  if (error) throw new Error(`Database error: ${error.message}`);

  // Step 3: Aggregate invoice amounts per supplier for this page
  const pageSupplierIds = (data ?? []).map((s) => s.id);
  let totals: Record<string, { pending: number; approved: number; paid: number; total: number }> = {};

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
    }[]).reduce<Record<string, { pending: number; approved: number; paid: number; total: number }>>(
      (acc, row) => {
        if (!acc[row.supplier_id]) acc[row.supplier_id] = { pending: 0, approved: 0, paid: 0, total: 0 };
        const amount = row.gross_amount ?? 0;
        acc[row.supplier_id].total += amount;
        if (row.status === 'pending') acc[row.supplier_id].pending += amount;
        if (row.status === 'approved') acc[row.supplier_id].approved += amount;
        if (row.status === 'paid') acc[row.supplier_id].paid += amount;
        return acc;
      },
      {},
    );
  }

  // Step 4: Fetch supplier_documents for respaldo derivation
  let respaldoMap: Record<string, { document_role: string | null }[]> = {};

  if (pageSupplierIds.length > 0) {
    const { data: docRows, error: docError } = await (supabase as any)
      .from('supplier_documents')
      .select('supplier_id, document_role')
      .in('supplier_id', pageSupplierIds)
      .is('deleted_at', null);

    if (docError) throw new Error(`Database error: ${docError.message}`);

    respaldoMap = ((docRows ?? []) as { supplier_id: string; document_role: string | null }[]).reduce<
      Record<string, { document_role: string | null }[]>
    >((acc, row) => {
      if (!acc[row.supplier_id]) acc[row.supplier_id] = [];
      acc[row.supplier_id].push({ document_role: row.document_role });
      return acc;
    }, {});
  }

  const suppliers: SupplierWithAmounts[] = (data ?? []).map((s) => ({
    ...s,
    pendingAmount: totals[s.id]?.pending ?? 0,
    approvedAmount: totals[s.id]?.approved ?? 0,
    paidAmount: totals[s.id]?.paid ?? 0,
    totalInvoiceAmount: totals[s.id]?.total ?? 0,
    totalApprovedAmount: (totals[s.id]?.approved ?? 0) + (totals[s.id]?.paid ?? 0),
    respaldoType: deriveRespaldoType(respaldoMap[s.id] ?? []),
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
