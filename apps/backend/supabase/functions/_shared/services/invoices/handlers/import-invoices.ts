import { importOrgInvoices } from '../actions/import-org-invoices.ts';

export async function importInvoices(
  orgId: string,
  from: string,
  defaultStatus: 'pending' | 'approved' | 'rejected',
): Promise<number> {
  return importOrgInvoices({ orgId, from, defaultStatus });
}
