/**
 * Upsert Supplier Payment Info Action
 */

import { logger } from '../../../utils/logger.ts';
import * as paymentInfoDb from '../../../db/supplier-payment-info.db.ts';
import { validateUpsertSupplierPaymentInfo } from '../../../db/schemas/supplier-payment-info.schema.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { SupplierPaymentInfo } from '../../../types/supplier-payment-info.ts';

function toPublic(row: paymentInfoDb.SupplierPaymentInfoRow): SupplierPaymentInfo {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    organizationId: row.organization_id,
    accountHolderName: row.account_holder_name,
    taxIdentifier: row.tax_identifier,
    bank: row.bank,
    accountType: row.account_type,
    accountNumber: row.account_number,
    currency: row.currency,
    email: row.email ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertSupplierPaymentInfo(
  supplierId: string,
  orgId: string,
  input: unknown,
): Promise<SupplierPaymentInfo> {
  try {
    logger.info('Upserting supplier payment info', { supplierId, orgId });

    const validated = validateUpsertSupplierPaymentInfo(input);

    const row = await paymentInfoDb.upsert({
      supplier_id: supplierId,
      organization_id: orgId,
      account_holder_name: validated.accountHolderName,
      tax_identifier: validated.taxIdentifier,
      bank: validated.bank,
      account_type: validated.accountType,
      account_number: validated.accountNumber,
      currency: validated.currency,
      email: validated.email ?? null,
    });

    return toPublic(row);
  } catch (error) {
    logger.error('Error upserting supplier payment info', { error: getErrorMessage(error) });
    throw error;
  }
}
