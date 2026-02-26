import { deleteInvoice as deleteInvoiceAction } from '../actions/delete-invoice.js';

export async function deleteInvoice(
  id: string,
  organizationId: string,
): Promise<void> {
  return deleteInvoiceAction(id, organizationId);
}
