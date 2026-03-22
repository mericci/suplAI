import { z } from 'zod';

export const CreateNominaSchema = z.object({
  invoiceIds: z.array(z.string().uuid()).optional().default([]),
});
