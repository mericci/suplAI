/**
 * Create Budget Item Action
 */

import * as budgetItemDb from '../../../db/budget-item.db.js';
import { validateCreateBudgetItem } from '../../../db/schemas/index.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { BudgetItemPublic, Periodicity } from '../types/index.js';

export async function createBudgetItem(
  organizationId: string,
  data: unknown,
): Promise<BudgetItemPublic> {
  try {
    const validated = validateCreateBudgetItem(data);

    const item = await budgetItemDb.create({
      organization_id: organizationId,
      name: validated.name,
      description: validated.description ?? null,
      amount: validated.amount,
      currency: validated.currency,
      periodicity: validated.periodicity,
      supplier_id: validated.supplierId ?? null,
    });

    return {
      id: item.id,
      organizationId: item.organization_id,
      name: item.name,
      description: item.description ?? null,
      amount: Number(item.amount),
      currency: item.currency,
      periodicity: item.periodicity as Periodicity,
      supplierId: item.supplier_id ?? null,
      supplierName: null,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
