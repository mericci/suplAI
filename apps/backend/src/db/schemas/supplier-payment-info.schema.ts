import { z } from 'zod';

export const UpsertSupplierPaymentInfoSchema = z.object({
  accountHolderName: z.string().min(1).max(200),
  taxIdentifier: z.string().min(1).max(50),
  bank: z.string().min(1).max(100),
  accountType: z.enum(['cuenta_corriente', 'cuenta_vista', 'cuenta_ahorro', 'cuenta_rut']),
  accountNumber: z.string().min(1).max(50),
  currency: z.enum(['CLP', 'USD', 'UF']).default('CLP'),
  email: z.string().email().optional().nullable(),
});

export type UpsertSupplierPaymentInfoInput = z.infer<typeof UpsertSupplierPaymentInfoSchema>;

export function validateUpsertSupplierPaymentInfo(
  data: unknown,
): UpsertSupplierPaymentInfoInput {
  return UpsertSupplierPaymentInfoSchema.parse(data);
}
