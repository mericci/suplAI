import { z } from 'zod';

export const CreateSupplierServiceSchema = z.object({
  supplierId: z.string().uuid('Invalid supplier ID'),
  organizationId: z.string().uuid('Invalid organization ID'),
  serviceCategory: z.string().min(1, 'Service category is required'),
  serviceDescription: z.string().nullable().optional(),
});

export type CreateSupplierServiceInput = z.infer<typeof CreateSupplierServiceSchema>;

export function validateCreateSupplierService(data: unknown): CreateSupplierServiceInput {
  return CreateSupplierServiceSchema.parse(data);
}
