/**
 * Organization Database Schema
 *
 * Validation rules for organization (tenant) data.
 * taxAuthorityPassword is accepted as plain text here and encrypted at the action layer.
 */

import { z } from 'zod';

export const CreateOrganizationSchema = z.object({
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

  taxAuthorityUsername: z.string().max(200).trim().optional()
    .nullable(),

  // Plain text password — encrypted by the action layer before storage.
  taxAuthorityPassword: z.string().min(1).optional().nullable(),
});

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();

export const OrganizationListFiltersSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100)
    .default(10),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
export type OrganizationListFilters = z.infer<
  typeof OrganizationListFiltersSchema
>;

export function validateCreateOrganization(
  data: unknown,
): CreateOrganizationInput {
  return CreateOrganizationSchema.parse(data);
}

export function validateUpdateOrganization(
  data: unknown,
): UpdateOrganizationInput {
  return UpdateOrganizationSchema.parse(data);
}

export function validateOrganizationListFilters(
  data: unknown,
): OrganizationListFilters {
  return OrganizationListFiltersSchema.parse(data);
}
