/**
 * Invoice Service Types
 */

import type {
  Database,
} from '../../../types/supabase.js';

type InvoiceStatus = Database['public']['Enums']['invoice_status'];

type InvoiceRow = Database['public']['Tables']['invoices']['Row'];

export interface InvoicePublic {
  id: string;
  organizationId: string;
  supplierId: string;
  serviceId: string | null;
  externalUniqueKey: string;
  issuerTaxIdentifier: string;
  receiverTaxIdentifier: string;
  documentType: string;
  documentTypeNumber: number;
  documentNumber: string;
  issueDate: string;
  dueDate: string | null;
  executiveTitleDate: string;
  status: InvoiceStatus;
  approvedByUserId: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  netAmount: number | null;
  taxAmount: number | null;
  grossAmount: number | null;
  aiValidationStatus: 'ok' | 'error' | null;
  aiValidationNotes: string | null;
  dteXml: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export function toPublic(invoice: InvoiceRow): InvoicePublic {
  return {
    id: invoice.id,
    organizationId: invoice.organization_id,
    supplierId: invoice.supplier_id,
    serviceId: (invoice as unknown as Record<string, unknown>).service_id as string | null ?? null,
    externalUniqueKey: invoice.external_unique_key,
    issuerTaxIdentifier: invoice.issuer_tax_identifier,
    receiverTaxIdentifier: invoice.receiver_tax_identifier,
    documentType: invoice.document_type,
    documentTypeNumber: invoice.document_type_number,
    documentNumber: invoice.document_number,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    executiveTitleDate: invoice.executive_title_date,
    status: invoice.status,
    approvedByUserId: invoice.approved_by_user_id,
    approvedAt: invoice.approved_at,
    paidAt: invoice.paid_at,
    netAmount: invoice.net_amount,
    taxAmount: invoice.tax_amount,
    grossAmount: invoice.gross_amount,
    aiValidationStatus: invoice.ai_validation_status as 'ok' | 'error' | null,
    aiValidationNotes: invoice.ai_validation_notes,
    dteXml: invoice.dte_xml ?? null,
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at,
    deletedAt: invoice.deleted_at,
  };
}
