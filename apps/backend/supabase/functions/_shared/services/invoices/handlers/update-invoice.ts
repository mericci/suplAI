import { updateInvoice as updateInvoiceAction } from '../actions/update-invoice.ts';
import type { InvoicePublic } from '../types/index.ts';

export async function updateInvoice(
  id: string,
  organizationId: string,
  data: unknown,
): Promise<InvoicePublic> {
  return updateInvoiceAction(id, organizationId, data);
}
