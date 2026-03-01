import { getInvoice as getInvoiceAction } from '../actions/get-invoice.ts';
import type { InvoicePublic } from '../types/index.ts';

export async function getInvoice(
  id: string,
  organizationId: string,
): Promise<InvoicePublic> {
  return getInvoiceAction(id, organizationId);
}
