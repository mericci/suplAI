/**
 * Supplier Service Types
 */

import type { Database } from '../../../types/supabase.ts';

type SupplierRow = Database['public']['Tables']['suppliers']['Row'];

export interface SupplierPublic {
  id: string;
  legalName: string;
  taxIdentifier: string;
  totalInvoiceAmount: number;
  totalApprovedAmount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SupplierSearchParams {
  id?: string;
  taxIdentifier?: string;
}

type SupplierInput = SupplierRow & {
  totalInvoiceAmount?: number;
  totalApprovedAmount?: number;
};

export function toPublic(supplier: SupplierInput): SupplierPublic {
  return {
    id: supplier.id,
    legalName: supplier.legal_name,
    taxIdentifier: supplier.tax_identifier,
    totalInvoiceAmount: supplier.totalInvoiceAmount ?? 0,
    totalApprovedAmount: supplier.totalApprovedAmount ?? 0,
    createdAt: supplier.created_at,
    updatedAt: supplier.updated_at,
    deletedAt: supplier.deleted_at,
  };
}
