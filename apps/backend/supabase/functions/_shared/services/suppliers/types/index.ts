/**
 * Supplier Service Types
 */

import type { Database } from '../../../types/supabase.ts';
import type { SupplierDocument } from '@supl/shared';
import type { SupplierDocumentRow } from '../../../db/supplier-document.db.ts';

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

export function toPublicDocument(doc: SupplierDocumentRow): SupplierDocument {
  return {
    id: doc.id,
    supplierId: doc.supplier_id,
    fileName: doc.file_name,
    storagePath: doc.storage_path,
    storageBucket: doc.storage_bucket,
    documentType: doc.document_type,
    serviceCategory: doc.service_category,
    serviceDescription: doc.service_description,
    tariffType: doc.tariff_type,
    tariffDetail: doc.tariff_detail,
    amounts: doc.amounts,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    deletedAt: doc.deleted_at,
  };
}
