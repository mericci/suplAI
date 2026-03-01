import { listInvoices as listInvoicesAction } from '../actions/list-invoices.ts';

export async function listInvoices(
  organizationId: string,
  filters: unknown,
): ReturnType<typeof listInvoicesAction> {
  return listInvoicesAction(organizationId, filters);
}
