/**
 * Supplier Payment Info Database Queries
 *
 * Data access layer for supplier payment info records.
 * All queries filter by deleted_at IS NULL (soft delete pattern).
 */

import { supabase } from '../lib/supabase.ts';

// supplier_payment_info is not yet in the Supabase-generated Database type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type AccountType = 'cuenta_corriente' | 'cuenta_vista' | 'cuenta_ahorro' | 'cuenta_rut';
export type Currency = 'CLP' | 'USD' | 'UF';

export interface SupplierPaymentInfoRow {
  id: string;
  supplier_id: string;
  organization_id: string;
  account_holder_name: string;
  tax_identifier: string;
  bank: string;
  account_type: AccountType;
  account_number: string;
  currency: Currency;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UpsertSupplierPaymentInfoData {
  supplier_id: string;
  organization_id: string;
  account_holder_name: string;
  tax_identifier: string;
  bank: string;
  account_type: AccountType;
  account_number: string;
  currency: Currency;
}

/**
 * Find active payment info for a supplier + org pair.
 */
export async function findBySupplierAndOrg(
  supplierId: string,
  orgId: string,
): Promise<SupplierPaymentInfoRow | null> {
  const { data, error } = await db
    .from('supplier_payment_info')
    .select('*')
    .eq('supplier_id', supplierId)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data as SupplierPaymentInfoRow;
}

/**
 * Insert or update payment info for a supplier + org pair.
 */
export async function upsert(data: UpsertSupplierPaymentInfoData): Promise<SupplierPaymentInfoRow> {
  const existing = await findBySupplierAndOrg(data.supplier_id, data.organization_id);

  if (existing) {
    const { data: updated, error } = await db
      .from('supplier_payment_info')
      .update({
        account_holder_name: data.account_holder_name,
        tax_identifier: data.tax_identifier,
        bank: data.bank,
        account_type: data.account_type,
        account_number: data.account_number,
        currency: data.currency,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(`Database error: ${error.message}`);
    return updated as SupplierPaymentInfoRow;
  }

  const { data: created, error } = await db
    .from('supplier_payment_info')
    .insert({
      supplier_id: data.supplier_id,
      organization_id: data.organization_id,
      account_holder_name: data.account_holder_name,
      tax_identifier: data.tax_identifier,
      bank: data.bank,
      account_type: data.account_type,
      account_number: data.account_number,
      currency: data.currency,
    })
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return created as SupplierPaymentInfoRow;
}
