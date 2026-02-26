import { importOrgInvoices } from '../actions/import-org-invoices.js';

export async function importInvoices(
  orgId: string,
  from: string,
  defaultStatus: 'pending' | 'approved' | 'rejected',
): Promise<number> {
  return importOrgInvoices({ orgId, from, defaultStatus });
}
