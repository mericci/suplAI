/**
 * Delete Cost Center Action (Edge Function)
 */

import * as costCenterDb from '../../../db/cost-center.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';

export async function deleteCostCenter(
  id: string,
  organizationId: string,
): Promise<boolean> {
  try {
    const existing = await costCenterDb.findById(id, organizationId);
    if (!existing) return false;

    await costCenterDb.softDeleteById(id, organizationId);
    return true;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
