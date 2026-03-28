/**
 * Delete Cost Center Action
 */

import * as costCenterDb from '../../../db/cost-center.db.js';
import { getErrorMessage } from '../../../utils/error.js';

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
