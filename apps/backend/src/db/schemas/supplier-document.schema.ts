import { z } from 'zod';

const SupplierDocumentAmountSchema = z.object({
  amount: z.number(),
  currency: z.string(),
  concept: z.string(),
  frequency: z.string(),
});

export const CreateSupplierDocumentSchema = z.object({
  supplierId: z.string().uuid('Invalid supplier ID'),
  fileName: z.string().min(1, 'File name is required'),
  storagePath: z.string().min(1, 'Storage path is required'),
  storageBucket: z.string().optional(),
  documentType: z.string().nullable().optional(),
  serviceCategory: z.string().nullable().optional(),
  serviceDescription: z.string().nullable().optional(),
  tariffType: z.string().nullable().optional(),
  tariffDetail: z.string().nullable().optional(),
  amounts: z.array(SupplierDocumentAmountSchema).optional(),
  serviceId: z.string().uuid().nullable().optional(),
  documentRole: z.enum(['cost_contract', 'additional']).optional(),
  isCurrent: z.boolean().optional(),
});

export type CreateSupplierDocumentInput = z.infer<typeof CreateSupplierDocumentSchema>;

export function validateCreateSupplierDocument(data: unknown): CreateSupplierDocumentInput {
  return CreateSupplierDocumentSchema.parse(data);
}
