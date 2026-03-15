/**
 * Invoice Database Schema
 *
 * Invoices are fetched from the external tax authority and stored locally.
 * The primary write pattern is upsert keyed on externalUniqueKey (computed SHA-256 hash).
 */

import { z } from 'zod';

export const InvoiceStatusEnum = z.enum(['pending', 'approved', 'rejected', 'paid']);
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;

export const UpsertInvoiceSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),

  supplierId: z.string().uuid('Invalid supplier ID'),

  issuerTaxIdentifier: z
    .string()
    .min(1, 'Issuer tax identifier is required')
    .max(50)
    .trim(),

  receiverTaxIdentifier: z
    .string()
    .min(1, 'Receiver tax identifier is required')
    .max(50)
    .trim(),

  documentType: z.string().min(1).trim(),

  documentTypeNumber: z.number().int(),

  documentNumber: z
    .string()
    .min(1, 'Document number is required')
    .max(50)
    .trim(),

  issueDate: z.coerce.date(),

  dueDate: z.coerce.date().optional().nullable(),

  status: InvoiceStatusEnum.optional().default('pending'),

  netAmount: z.number().nonnegative().nullable().optional(),
  taxAmount: z.number().nonnegative().nullable().optional(),
  grossAmount: z.number().nonnegative().nullable().optional(),
});

export const UpdateInvoiceSchema = z.object({
  status: InvoiceStatusEnum.optional(),
  dueDate: z.coerce.date().optional().nullable(),
  approvedByUserId: z.string().uuid().optional().nullable(),
  approvedAt: z.coerce.date().optional().nullable(),
});

export const InvoiceListFiltersSchema = z.object({
  status: InvoiceStatusEnum.optional(),
  supplierId: z.string().uuid().optional(),
  issuedAfter: z.coerce.date().optional(),
  issuedBefore: z.coerce.date().optional(),
  grossAmountGte: z.coerce.number().optional(),
  grossAmountLte: z.coerce.number().optional(),
  grossAmountEq: z.coerce.number().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(500).default(10),
  sortBy: z.enum([
    'issue_date', 'gross_amount', 'document_type', 'document_number',
    'approved_at', 'due_date', 'executive_title_date', 'ai_validation_status',
  ]).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

export type UpsertInvoiceInput = z.infer<typeof UpsertInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;
export type InvoiceListFilters = z.infer<typeof InvoiceListFiltersSchema>;

export function validateUpsertInvoice(data: unknown): UpsertInvoiceInput {
  return UpsertInvoiceSchema.parse(data);
}

export function validateUpdateInvoice(data: unknown): UpdateInvoiceInput {
  return UpdateInvoiceSchema.parse(data);
}

export function validateInvoiceListFilters(data: unknown): InvoiceListFilters {
  return InvoiceListFiltersSchema.parse(data);
}
