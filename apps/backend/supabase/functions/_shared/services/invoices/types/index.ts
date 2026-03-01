/**
 * Invoice Service Types
 */

import type {
  Database,
  DocumentType,
  InvoiceStatus,
} from '../../../types/supabase.ts';

type InvoiceRow = Database['public']['Tables']['invoices']['Row'];

export interface InvoicePublic {
  id: string;
  organizationId: string;
  supplierId: string;
  externalUniqueKey: string;
  issuerTaxIdentifier: string;
  receiverTaxIdentifier: string;
  documentType: DocumentType;
  documentNumber: string;
  issueDate: string;
  dueDate: string | null;
  executiveTitleDate: string;
  status: InvoiceStatus;
  approvedByUserId: string | null;
  approvedAt: string | null;
  netAmount: number | null;
  taxAmount: number | null;
  grossAmount: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export function toPublic(invoice: InvoiceRow): InvoicePublic {
  return {
    id: invoice.id,
    organizationId: invoice.organization_id,
    supplierId: invoice.supplier_id,
    externalUniqueKey: invoice.external_unique_key,
    issuerTaxIdentifier: invoice.issuer_tax_identifier,
    receiverTaxIdentifier: invoice.receiver_tax_identifier,
    documentType: invoice.document_type,
    documentNumber: invoice.document_number,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    executiveTitleDate: invoice.executive_title_date,
    status: invoice.status,
    approvedByUserId: invoice.approved_by_user_id,
    approvedAt: invoice.approved_at,
    netAmount: invoice.net_amount,
    taxAmount: invoice.tax_amount,
    grossAmount: invoice.gross_amount,
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at,
    deletedAt: invoice.deleted_at,
  };
}
