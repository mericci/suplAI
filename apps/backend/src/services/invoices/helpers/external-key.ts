/**
 * Invoice External Unique Key Helper
 *
 * Computes a deterministic SHA-256 hash from the composite of:
 *   receiver_tax_identifier : issuer_tax_identifier : document_type : document_number
 *
 * All components are lowercased and trimmed before hashing.
 * This produces a 64-character hex string used as the idempotency key for upserts.
 *
 * Adding document_type prevents collisions between, e.g.,
 * invoice #100 and credit note #100 from the same issuer.
 */

import crypto from 'node:crypto';

export interface ExternalKeyParams {
  receiverTaxIdentifier: string;
  issuerTaxIdentifier: string;
  documentType: string;
  documentNumber: string;
}

export function computeExternalUniqueKey(params: ExternalKeyParams): string {
  const composite = [
    params.receiverTaxIdentifier.trim().toLowerCase(),
    params.issuerTaxIdentifier.trim().toLowerCase(),
    params.documentType.trim().toLowerCase(),
    params.documentNumber.trim().toLowerCase(),
  ].join(':');

  return crypto.createHash('sha256').update(composite, 'utf8').digest('hex');
}
