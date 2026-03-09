/**
 * Invoice Database Queries
 *
 * Data access layer for invoice operations.
 * All queries are scoped to an organizationId (multi-tenant isolation).
 * All queries filter by deleted_at IS NULL (soft delete pattern).
 */

import { supabase } from '../lib/supabase.js';
import type { Database } from '../types/supabase.js';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type CreateInvoiceInput = Database['public']['Tables']['invoices']['Insert'];
type UpdateInvoiceInput = Database['public']['Tables']['invoices']['Update'];

/**
 * Find an active invoice by ID, scoped to an organization.
 */
export async function findById(
  id: string,
  organizationId: string,
): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}

/**
 * Find an active invoice by external unique key, scoped to an organization.
 */
export async function findByExternalKey(
  externalUniqueKey: string,
  organizationId: string,
): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('external_unique_key', externalUniqueKey)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}

/**
 * Create a new invoice.
 */
export async function create(data: CreateInvoiceInput): Promise<Invoice> {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert(data as never)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return invoice as Invoice;
}

/**
 * Update an invoice by ID, scoped to an organization.
 */
export async function update(
  id: string,
  organizationId: string,
  data: UpdateInvoiceInput,
): Promise<Invoice> {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .update(data as never)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return invoice as Invoice;
}

/**
 * Soft-delete an invoice by ID, scoped to an organization.
 */
export async function softDeleteById(
  id: string,
  organizationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('invoices')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}

/**
 * Find the most recently issued active invoice for an organization.
 */
export async function findLatestByOrganization(
  organizationId: string,
): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('issue_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}

/**
 * Find all active invoices with status 'pending' for an organization.
 */
export async function findPendingByOrganization(
  organizationId: string,
): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
  return data ?? [];
}

/**
 * List active invoices for an organization with optional filters and pagination.
 */
export async function findAllByOrganization(
  organizationId: string,
  limit: number,
  offset: number,
  filters: {
    status?: string;
    supplierId?: string;
    issuedAfter?: Date;
    issuedBefore?: Date;
    grossAmountGte?: number;
    grossAmountLte?: number;
    grossAmountEq?: number;
  } = {},
): Promise<{ invoices: Invoice[]; total: number }> {
  let countQuery = supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  let dataQuery = supabase
    .from('invoices')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (filters.status) {
    countQuery = countQuery.eq('status', filters.status);
    dataQuery = dataQuery.eq('status', filters.status);
  }
  if (filters.supplierId) {
    countQuery = countQuery.eq('supplier_id', filters.supplierId);
    dataQuery = dataQuery.eq('supplier_id', filters.supplierId);
  }
  if (filters.issuedAfter) {
    countQuery = countQuery.gte(
      'issue_date',
      filters.issuedAfter.toISOString().split('T')[0],
    );
    dataQuery = dataQuery.gte(
      'issue_date',
      filters.issuedAfter.toISOString().split('T')[0],
    );
  }
  if (filters.issuedBefore) {
    countQuery = countQuery.lte(
      'issue_date',
      filters.issuedBefore.toISOString().split('T')[0],
    );
    dataQuery = dataQuery.lte(
      'issue_date',
      filters.issuedBefore.toISOString().split('T')[0],
    );
  }
  if (filters.grossAmountGte !== undefined) {
    countQuery = countQuery.gte('gross_amount', filters.grossAmountGte);
    dataQuery = dataQuery.gte('gross_amount', filters.grossAmountGte);
  }
  if (filters.grossAmountLte !== undefined) {
    countQuery = countQuery.lte('gross_amount', filters.grossAmountLte);
    dataQuery = dataQuery.lte('gross_amount', filters.grossAmountLte);
  }
  if (filters.grossAmountEq !== undefined) {
    countQuery = countQuery.eq('gross_amount', filters.grossAmountEq);
    dataQuery = dataQuery.eq('gross_amount', filters.grossAmountEq);
  }

  const { count, error: countError } = await countQuery;
  if (countError) throw new Error(`Database error: ${countError.message}`);

  const { data, error } = await dataQuery
    .range(offset, offset + limit - 1)
    .order('issue_date', { ascending: false });

  if (error) throw new Error(`Database error: ${error.message}`);

  return {
    invoices: data ?? [],
    total: count ?? 0,
  };
}
