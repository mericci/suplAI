/**
 * Delete Accounting ID Action (Edge Function)
 */

import * as accountingIdDb from '../../../db/accounting-id.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';

export async function deleteAccountingId(
  id: string,
  organizationId: string,
): Promise<boolean> {
  try {
    const existing = await accountingIdDb.findById(id, organizationId);
    if (!existing) return false;

    await accountingIdDb.softDeleteById(id, organizationId);
    return true;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
