/**
 * Supplier Service Types
 */

import type { SupplierDocument, SupplierService } from '@supl/shared';
import type { Database } from '../../../types/supabase.js';
import type { SupplierDocumentRow } from '../../../db/supplier-document.db.js';
import type { SupplierServiceRow } from '../../../db/supplier-service.db.js';

type SupplierRow = Database['public']['Tables']['suppliers']['Row'];

export interface SupplierPublic {
  id: string;
  legalName: string;
  taxIdentifier: string;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  totalInvoiceAmount: number;
  totalApprovedAmount: number;
  respaldoType: 'none' | 'manual_insight' | 'validated_document';
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SupplierSearchParams {
  id?: string;
  taxIdentifier?: string;
}

type SupplierInput = SupplierRow & {
  pendingAmount?: number;
  approvedAmount?: number;
  paidAmount?: number;
  totalInvoiceAmount?: number;
  totalApprovedAmount?: number;
  respaldoType?: 'none' | 'manual_insight' | 'validated_document';
};

export function toPublic(supplier: SupplierInput): SupplierPublic {
  return {
    id: supplier.id,
    legalName: supplier.legal_name,
    taxIdentifier: supplier.tax_identifier,
    pendingAmount: supplier.pendingAmount ?? 0,
    approvedAmount: supplier.approvedAmount ?? 0,
    paidAmount: supplier.paidAmount ?? 0,
    totalInvoiceAmount: supplier.totalInvoiceAmount ?? 0,
    totalApprovedAmount: supplier.totalApprovedAmount ?? 0,
    respaldoType: supplier.respaldoType ?? 'none',
    createdAt: supplier.created_at,
    updatedAt: supplier.updated_at,
    deletedAt: supplier.deleted_at,
  };
}

export function toPublicService(row: SupplierServiceRow): SupplierService {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    organizationId: row.organization_id,
    serviceCategory: row.service_category,
    serviceDescription: row.service_description,
    costCenterId: row.cost_center_id ?? null,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
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
    serviceId: doc.service_id,
    documentRole: doc.document_role,
    isCurrent: doc.is_current,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    deletedAt: doc.deleted_at,
  };
}
