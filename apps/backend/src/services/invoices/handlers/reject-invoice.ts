import { rejectInvoice as rejectInvoiceAction } from '../actions/reject-invoice.js';
import type { InvoicePublic } from '../types/index.js';

export async function rejectInvoice(
  id: string,
  organizationId: string,
  rejectedByUserId: string,
): Promise<InvoicePublic> {
  return rejectInvoiceAction(id, organizationId, rejectedByUserId);
}
