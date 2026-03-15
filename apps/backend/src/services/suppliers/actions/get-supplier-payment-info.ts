/**
 * Get Supplier Payment Info Action
 */

import type { SupplierPaymentInfo } from '@supl/shared';
import { logger } from '../../../utils/logger.js';
import * as paymentInfoDb from '../../../db/supplier-payment-info.db.js';
import { getErrorMessage } from '../../../utils/error.js';

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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSupplierPaymentInfo(
  supplierId: string,
  orgId: string,
): Promise<SupplierPaymentInfo | null> {
  try {
    logger.info('Getting supplier payment info', { supplierId, orgId });
    const row = await paymentInfoDb.findBySupplierAndOrg(supplierId, orgId);
    return row ? toPublic(row) : null;
  } catch (error) {
    logger.error('Error getting supplier payment info', { error: getErrorMessage(error) });
    throw error;
  }
}
