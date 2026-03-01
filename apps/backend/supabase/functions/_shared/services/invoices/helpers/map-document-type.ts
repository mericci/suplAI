import type { DocumentType } from '../../../db/schemas/invoice.schema.ts';

/**
 * Maps a SII tipoDoc code to our internal DocumentType enum.
 *
 * | SII codes      | DocumentType  |
 * |----------------|---------------|
 * | 33, 34, 46, 52 | invoice       |
 * | 39, 41         | receipt       |
 * | 56             | debit_note    |
 * | 61             | credit_note   |
 * | anything else  | invoice       |
 */
export function mapSiiDocumentType(tipoDoc: number): DocumentType {
  if ([33, 34, 46, 52].includes(tipoDoc)) return 'invoice';
  if ([39, 41].includes(tipoDoc)) return 'receipt';
  if (tipoDoc === 56) return 'debit_note';
  if (tipoDoc === 61) return 'credit_note';
  return 'invoice';
}
