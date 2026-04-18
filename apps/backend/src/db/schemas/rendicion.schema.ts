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

export const UpdateRendicionRutSchema = z.object({
  rut: z.string().min(1).max(20),
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
