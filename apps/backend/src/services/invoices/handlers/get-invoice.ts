import { getInvoice as getInvoiceAction } from '../actions/get-invoice.js';
import type { InvoicePublic } from '../types/index.js';

export async function getInvoice(
  id: string,
  organizationId: string,
): Promise<InvoicePublic> {
  return getInvoiceAction(id, organizationId);
}
