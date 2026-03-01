import { syncOrgInvoices } from '../actions/sync-org-invoices.ts';

export async function syncInvoices(organizationId: string): Promise<void> {
  return syncOrgInvoices(organizationId);
}
