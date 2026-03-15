import type { SupplierPaymentInfo } from '@supl/shared';
import { getSupplierPaymentInfo as getSupplierPaymentInfoAction } from '../actions/get-supplier-payment-info.js';

export async function getSupplierPaymentInfo(
  supplierId: string,
  orgId: string,
): Promise<SupplierPaymentInfo | null> {
  return getSupplierPaymentInfoAction(supplierId, orgId);
}
