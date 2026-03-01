/**
 * Supplier Database Schema
 *
 * Suppliers are global (not per-organization). Deduplication is by taxIdentifier.
 * Upsert (find-or-create) is the primary write pattern.
 */

import { z } from 'zod';

export const CreateSupplierSchema = z.object({
  legalName: z
    .string()
    .min(2, 'Legal name must be at least 2 characters')
    .max(200, 'Legal name must not exceed 200 characters')
    .trim(),

  taxIdentifier: z
    .string()
    .min(1, 'Tax identifier is required')
    .max(50, 'Tax identifier must not exceed 50 characters')
    .trim(),
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial();

// Upsert requires both fields (full data for create-or-update)
export const UpsertSupplierSchema = CreateSupplierSchema;

export const SupplierListFiltersSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100)
    .default(10),
});

export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>;
export type UpsertSupplierInput = z.infer<typeof UpsertSupplierSchema>;
export type SupplierListFilters = z.infer<typeof SupplierListFiltersSchema>;

export function validateCreateSupplier(data: unknown): CreateSupplierInput {
  return CreateSupplierSchema.parse(data);
}

export function validateUpdateSupplier(data: unknown): UpdateSupplierInput {
  return UpdateSupplierSchema.parse(data);
}

export function validateUpsertSupplier(data: unknown): UpsertSupplierInput {
  return UpsertSupplierSchema.parse(data);
}

export function validateSupplierListFilters(
  data: unknown,
): SupplierListFilters {
  return SupplierListFiltersSchema.parse(data);
}
