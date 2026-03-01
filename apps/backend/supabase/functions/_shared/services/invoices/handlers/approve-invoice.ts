import { approveInvoice as approveInvoiceAction } from '../actions/approve-invoice.ts';
import type { InvoicePublic } from '../types/index.ts';

export async function approveInvoice(
  id: string,
  organizationId: string,
  approvedByUserId: string,
): Promise<InvoicePublic> {
  return approveInvoiceAction(id, organizationId, approvedByUserId);
}
