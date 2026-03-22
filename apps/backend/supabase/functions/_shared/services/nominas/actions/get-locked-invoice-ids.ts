/**
 * Get Locked Invoice IDs Action (Edge Function)
 */

import * as nominaDb from '../../../db/nomina.db.ts';

export async function getLockedInvoiceIds(orgId: string): Promise<string[]> {
  return nominaDb.findLockedInvoiceIds(orgId);
}
