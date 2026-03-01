import { z } from 'zod';

export const OrganizationSupplierSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  supplierId: z.string().uuid('Invalid supplier ID'),
});

export type OrganizationSupplierInput = z.infer<
  typeof OrganizationSupplierSchema
>;

export function validateOrganizationSupplier(
  data: unknown,
): OrganizationSupplierInput {
  return OrganizationSupplierSchema.parse(data);
}
