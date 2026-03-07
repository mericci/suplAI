/**
 * Supplier Document Database Queries (Edge Function)
 */

import { supabase } from '../lib/supabase.ts';
import type { SupplierDocumentAmount } from '../types/supplier-document.ts';

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
  document_role?: 'cost_contract' | 'additional';
  is_current?: boolean;
}

export async function create(data: CreateSupplierDocumentData): Promise<SupplierDocumentRow> {
  const { data: doc, error } = await (supabase as any)
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
      document_role: data.document_role ?? 'cost_contract',
      is_current: data.is_current ?? false,
    })
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return doc as SupplierDocumentRow;
}

export async function demoteCurrentDocuments(supplierId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('supplier_documents')
    .update({ is_current: false })
    .eq('supplier_id', supplierId)
    .eq('document_role', 'cost_contract')
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}

export async function findBySupplier(supplierId: string): Promise<SupplierDocumentRow[]> {
  const { data, error } = await (supabase as any)
    .from('supplier_documents')
    .select('*')
    .eq('supplier_id', supplierId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as SupplierDocumentRow[];
}

export async function findById(id: string): Promise<SupplierDocumentRow | null> {
  const { data, error } = await (supabase as any)
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

export async function softDelete(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('supplier_documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}
