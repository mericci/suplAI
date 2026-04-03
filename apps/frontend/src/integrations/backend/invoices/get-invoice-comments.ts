import { backendClient, type ApiResponse } from '../client';

export interface InvoiceComment {
  id: string;
  invoice_id: string;
  organization_id: string;
  user_id: string | null;
  content: string;
  type: 'comment' | 'rejection';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export async function getInvoiceComments(
  orgId: string,
  invoiceId: string,
): Promise<ApiResponse<InvoiceComment[]>> {
  return backendClient.get<ApiResponse<InvoiceComment[]>>(
    `/api/organizations/${orgId}/invoices/${invoiceId}/comments`,
  );
}

export async function createInvoiceComment(
  orgId: string,
  invoiceId: string,
  content: string,
  type: 'comment' | 'rejection' = 'comment',
): Promise<ApiResponse<InvoiceComment>> {
  return backendClient.post<ApiResponse<InvoiceComment>>(
    `/api/organizations/${orgId}/invoices/${invoiceId}/comments`,
    { content, type },
  );
}
