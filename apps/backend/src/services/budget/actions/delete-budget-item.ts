/**
 * Delete Budget Item Action
 */

import * as budgetItemDb from '../../../db/budget-item.db.js';
import { getErrorMessage } from '../../../utils/error.js';

export async function deleteBudgetItem(
  id: string,
  organizationId: string,
): Promise<void> {
  try {
    const existing = await budgetItemDb.findById(id, organizationId);
    if (!existing) throw new Error('Budget item not found');
    await budgetItemDb.softDeleteById(id, organizationId);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
