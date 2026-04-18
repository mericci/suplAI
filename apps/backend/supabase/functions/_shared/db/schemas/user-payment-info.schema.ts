import { z } from 'zod';

export const AccountTypeEnum = z.enum([
  'cuenta_corriente',
  'cuenta_vista',
  'cuenta_ahorro',
  'cuenta_rut',
]);

export const CreateUserPaymentInfoSchema = z.object({
  bank: z.string().min(1).max(100),
  accountType: AccountTypeEnum,
  accountNumber: z.string().min(1).max(50),
  isDefault: z.boolean().optional().default(false),
});

export const UpdateUserPaymentInfoSchema = z.object({
  bank: z.string().min(1).max(100).optional(),
  accountType: AccountTypeEnum.optional(),
  accountNumber: z.string().min(1).max(50).optional(),
  isDefault: z.boolean().optional(),
});

export type CreateUserPaymentInfoInput = z.infer<typeof CreateUserPaymentInfoSchema>;
export type UpdateUserPaymentInfoInput = z.infer<typeof UpdateUserPaymentInfoSchema>;

export function validateCreateUserPaymentInfo(data: unknown): CreateUserPaymentInfoInput {
  return CreateUserPaymentInfoSchema.parse(data);
}

export function validateUpdateUserPaymentInfo(data: unknown): UpdateUserPaymentInfoInput {
  return UpdateUserPaymentInfoSchema.parse(data);
}
