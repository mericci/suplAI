/**
 * Get Locked Invoice IDs Action
 *
 * Returns invoice IDs that are locked in a pending nomina for this org.
 */

import * as nominaDb from '../../../db/nomina.db.js';

export async function getLockedInvoiceIds(orgId: string): Promise<string[]> {
  return nominaDb.findLockedInvoiceIds(orgId);
}
