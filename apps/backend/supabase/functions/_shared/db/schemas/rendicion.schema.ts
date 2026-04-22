import { z } from 'zod';

export const RendicionStatusEnum = z.enum(['pending', 'approved', 'rejected']);

export const CreateRendicionSchema = z.object({
  userPaymentInfoId: z.string().uuid(),
});

export const ApproveRendicionSchema = z.object({
  aiValidated: z.boolean().optional().default(true),
});

export const RejectRendicionSchema = z.object({
  rejectionNotes: z.string().min(1).max(1000),
  documentCorrections: z
    .array(
      z.object({
        documentId: z.string().uuid(),
        correctedAmount: z.number().positive(),
      }),
    )
    .optional(),
});

function normalizeRut(rut: string): string {
  return rut.replace(/\./g, '').replace(/-/g, '').toUpperCase().trim();
}

function isValidChileanRut(rut: string): boolean {
  if (!/^\d{7,8}[0-9K]$/.test(rut)) return false;
  const body = rut.slice(0, -1);
  const dv = rut.slice(-1);
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier < 7 ? multiplier + 1 : 2;
  }
  const computed = 11 - (sum % 11);
  const expected = computed === 11 ? '0' : computed === 10 ? 'K' : computed.toString();
  return dv === expected;
}

export const UpdateRendicionRutSchema = z.object({
  rut: z
    .string()
    .transform(normalizeRut)
    .refine(isValidChileanRut, { message: 'Invalid Chilean RUT' }),
});

export type CreateRendicionInput = z.infer<typeof CreateRendicionSchema>;
export type ApproveRendicionInput = z.infer<typeof ApproveRendicionSchema>;
export type RejectRendicionInput = z.infer<typeof RejectRendicionSchema>;
export type UpdateRendicionRutInput = z.infer<typeof UpdateRendicionRutSchema>;

export function validateCreateRendicion(data: unknown): CreateRendicionInput {
  return CreateRendicionSchema.parse(data);
}

export function validateApproveRendicion(data: unknown): ApproveRendicionInput {
  return ApproveRendicionSchema.parse(data);
}

export function validateRejectRendicion(data: unknown): RejectRendicionInput {
  return RejectRendicionSchema.parse(data);
}

export function validateUpdateRendicionRut(data: unknown): UpdateRendicionRutInput {
  return UpdateRendicionRutSchema.parse(data);
}
