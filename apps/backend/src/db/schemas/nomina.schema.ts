import { z } from 'zod';

export const CreateNominaSchema = z.object({
  invoiceIds: z.array(z.string().uuid()).optional().default([]),
});

export const UpdateNominaInvoicesSchema = z.object({
  invoiceIds: z.array(z.string().uuid()).min(1, 'At least one invoice is required'),
});
