/**
 * Budget Item Database Schema
 *
 * Defines structure and validation rules for the budget_items table.
 */

import { z } from 'zod';

export const PeriodicityEnum = z.enum(['monthly', 'quarterly', 'annual']);
export type Periodicity = z.infer<typeof PeriodicityEnum>;

export const BudgetPeriodEnum = z.enum(['current_month', 'ytd', 'annual']);
export type BudgetPeriod = z.infer<typeof BudgetPeriodEnum>;

export const CreateBudgetItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must not exceed 200 characters').trim(),
  description: z.string().max(500, 'Description must not exceed 500 characters').trim().optional().nullable(),
  amount: z.number().nonnegative('Amount must be >= 0'),
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('CLP'),
  periodicity: PeriodicityEnum.default('monthly'),
  supplierId: z.string().uuid('Invalid supplier ID').optional().nullable(),
});

export type CreateBudgetItemInput = z.infer<typeof CreateBudgetItemSchema>;

export function validateCreateBudgetItem(data: unknown): CreateBudgetItemInput {
  return CreateBudgetItemSchema.parse(data);
}
