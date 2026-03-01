import { rejectInvoice as rejectInvoiceAction } from '../actions/reject-invoice.ts';
import type { InvoicePublic } from '../types/index.ts';

export async function rejectInvoice(
  id: string,
  organizationId: string,
  rejectedByUserId: string,
): Promise<InvoicePublic> {
  return rejectInvoiceAction(id, organizationId, rejectedByUserId);
}
