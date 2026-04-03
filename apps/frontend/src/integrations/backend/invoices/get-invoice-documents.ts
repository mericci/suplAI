import { backendClient, type ApiResponse } from '../client';

export interface InvoiceDocument {
  id: string;
  invoice_id: string;
  organization_id: string;
  file_name: string;
  storage_path: string;
  storage_bucket: string;
  description: string | null;
  uploaded_by_user_id: string | null;
  created_at: string;
  deleted_at: string | null;
}

export async function getInvoiceDocuments(
  orgId: string,
  invoiceId: string,
): Promise<ApiResponse<InvoiceDocument[]>> {
  return backendClient.get<ApiResponse<InvoiceDocument[]>>(
    `/api/organizations/${orgId}/invoices/${invoiceId}/documents`,
  );
}

export async function uploadInvoiceDocument(
  orgId: string,
  invoiceId: string,
  formData: FormData,
): Promise<ApiResponse<InvoiceDocument>> {
  return backendClient.postFormData<ApiResponse<InvoiceDocument>>(
    `/api/organizations/${orgId}/invoices/${invoiceId}/documents`,
    formData,
  );
}
