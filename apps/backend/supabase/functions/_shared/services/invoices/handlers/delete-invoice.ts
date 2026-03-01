import { deleteInvoice as deleteInvoiceAction } from '../actions/delete-invoice.ts';

export async function deleteInvoice(
  id: string,
  organizationId: string,
): Promise<void> {
  return deleteInvoiceAction(id, organizationId);
}
