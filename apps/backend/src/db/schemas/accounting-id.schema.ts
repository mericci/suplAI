/**
 * Accounting ID Database Schema
 *
 * Defines structure and validation rules for accounting ID operations.
 */

import { z } from 'zod';

export const CreateAccountingIdSchema = z.object({
  externalId: z.string().min(1, 'El ID es requerido').max(100, 'El ID no puede superar 100 caracteres').trim(),
  description: z.string().min(1, 'La descripción es requerida').max(500, 'La descripción no puede superar 500 caracteres').trim(),
});

export type CreateAccountingIdInput = z.infer<typeof CreateAccountingIdSchema>;

export const UpdateAccountingIdSchema = z.object({
  externalId: z.string().min(1).max(100).trim().optional(),
  description: z.string().min(1).max(500).trim().optional(),
});

export type UpdateAccountingIdInput = z.infer<typeof UpdateAccountingIdSchema>;

export function validateCreateAccountingId(data: unknown): CreateAccountingIdInput {
  return CreateAccountingIdSchema.parse(data);
}

export function validateUpdateAccountingId(data: unknown): UpdateAccountingIdInput {
  return UpdateAccountingIdSchema.parse(data);
}
