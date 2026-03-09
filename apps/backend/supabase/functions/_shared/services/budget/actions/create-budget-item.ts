/**
 * Create Budget Item Action
 */

import { z } from 'zod';
import * as budgetItemDb from '../../../db/budget-item.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { BudgetItemPublic, Periodicity } from '../types/index.ts';

const CreateBudgetItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must not exceed 200 characters').trim(),
  description: z.string().max(500, 'Description must not exceed 500 characters').trim().optional().nullable(),
  amount: z.number().nonnegative('Amount must be >= 0'),
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('CLP'),
  periodicity: z.enum(['monthly', 'quarterly', 'annual']).default('monthly'),
  supplierId: z.string().uuid('Invalid supplier ID').optional().nullable(),
});

export async function createBudgetItem(
  organizationId: string,
  data: unknown,
): Promise<BudgetItemPublic> {
  try {
    const validated = CreateBudgetItemSchema.parse(data);

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
