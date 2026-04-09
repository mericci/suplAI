/**
 * Supplier Document Database Queries
 *
 * Data access layer for supplier document records.
 * All queries filter by deleted_at IS NULL (soft delete pattern).
 */

import type { SupplierDocumentAmount } from '@supl/shared';
import { supabase } from '../lib/supabase.js';

// supplier_documents is not yet in the Supabase-generated Database type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface SupplierDocumentRow {
  id: string;
  supplier_id: string;
  file_name: string;
  storage_path: string;
  storage_bucket: string;
  document_type: string | null;
  service_category: string | null;
  service_description: string | null;
  tariff_type: string | null;
  tariff_detail: string | null;
  amounts: SupplierDocumentAmount[];
  service_id: string | null;
  document_role: 'cost_contract' | 'additional';
  is_current: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateSupplierDocumentData {
  supplier_id: string;
  file_name: string;
  storage_path: string;
  storage_bucket?: string;
  document_type?: string | null;
  service_category?: string | null;
  service_description?: string | null;
  tariff_type?: string | null;
  tariff_detail?: string | null;
  amounts?: SupplierDocumentAmount[];
  service_id?: string | null;
  document_role?: 'cost_contract' | 'additional';
  is_current?: boolean;
}

/**
 * Create a new supplier document record.
 */
export async function create(data: CreateSupplierDocumentData): Promise<SupplierDocumentRow> {
  const { data: doc, error } = await db
    .from('supplier_documents')
    .insert({
      supplier_id: data.supplier_id,
      file_name: data.file_name,
      storage_path: data.storage_path,
      storage_bucket: data.storage_bucket ?? 'supplier-evidence',
      document_type: data.document_type ?? null,
      service_category: data.service_category ?? null,
      service_description: data.service_description ?? null,
      tariff_type: data.tariff_type ?? null,
      tariff_detail: data.tariff_detail ?? null,
      amounts: data.amounts ?? [],
      service_id: data.service_id ?? null,
      document_role: data.document_role ?? 'cost_contract',
      is_current: data.is_current ?? false,
    })
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return doc as SupplierDocumentRow;
}

/**
 * Demote all current cost_contract documents for a specific service (set is_current = false).
 * Scoped by serviceId so that other services for the same supplier are unaffected.
 */
export async function demoteCurrentDocuments(supplierId: string, serviceId: string): Promise<void> {
  const { error } = await db
    .from('supplier_documents')
    .update({ is_current: false })
    .eq('supplier_id', supplierId)
    .eq('service_id', serviceId)
    .eq('document_role', 'cost_contract')
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}

/**
 * List active documents for a supplier, ordered by creation date ascending.
 */
export async function findBySupplier(supplierId: string): Promise<SupplierDocumentRow[]> {
  const { data, error } = await db
    .from('supplier_documents')
    .select('*')
    .eq('supplier_id', supplierId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as SupplierDocumentRow[];
}

/**
 * Find a single active document by ID.
 */
export async function findById(id: string): Promise<SupplierDocumentRow | null> {
  const { data, error } = await db
    .from('supplier_documents')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data as SupplierDocumentRow;
}

/**
 * Find the current cost contract for a supplier (is_current = true, document_role = 'cost_contract').
 */
export async function findCurrentCostContract(supplierId: string): Promise<SupplierDocumentRow | null> {
  const { data, error } = await db
    .from('supplier_documents')
    .select('*')
    .eq('supplier_id', supplierId)
    .eq('document_role', 'cost_contract')
    .eq('is_current', true)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data as SupplierDocumentRow;
}

/**
 * Soft-delete a document by ID.
 */
export async function softDelete(id: string): Promise<void> {
  const { error } = await db
    .from('supplier_documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}
