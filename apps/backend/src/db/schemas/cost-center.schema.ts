/**
 * Cost Center Database Schema
 *
 * Defines structure and validation rules for cost center operations.
 */

import { z } from 'zod';

export const CreateCostCenterSchema = z.object({
  externalId: z.string().min(1, 'El ID es requerido').max(100, 'El ID no puede superar 100 caracteres').trim(),
  name: z.string().min(1, 'El nombre es requerido').max(200, 'El nombre no puede superar 200 caracteres').trim(),
  userIds: z.array(z.string().uuid('ID de usuario inválido')).optional().default([]),
});

export type CreateCostCenterInput = z.infer<typeof CreateCostCenterSchema>;

export const UpdateCostCenterSchema = z.object({
  externalId: z.string().min(1).max(100).trim().optional(),
  name: z.string().min(1).max(200).trim().optional(),
  userIds: z.array(z.string().uuid()).optional(),
});

export type UpdateCostCenterInput = z.infer<typeof UpdateCostCenterSchema>;

export function validateCreateCostCenter(data: unknown): CreateCostCenterInput {
  return CreateCostCenterSchema.parse(data);
}

export function validateUpdateCostCenter(data: unknown): UpdateCostCenterInput {
  return UpdateCostCenterSchema.parse(data);
}
