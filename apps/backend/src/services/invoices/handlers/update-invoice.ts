import { updateInvoice as updateInvoiceAction } from '../actions/update-invoice.js';
import type { InvoicePublic } from '../types/index.js';

export async function updateInvoice(
  id: string,
  organizationId: string,
  data: unknown,
): Promise<InvoicePublic> {
  return updateInvoiceAction(id, organizationId, data);
}
