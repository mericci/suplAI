import { approveInvoice as approveInvoiceAction } from '../actions/approve-invoice.js';
import type { InvoicePublic } from '../types/index.js';

export async function approveInvoice(
  id: string,
  organizationId: string,
  approvedByUserId: string,
): Promise<InvoicePublic> {
  return approveInvoiceAction(id, organizationId, approvedByUserId);
}
