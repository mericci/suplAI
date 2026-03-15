import { getSupplierPaymentInfo as getSupplierPaymentInfoAction } from '../actions/get-supplier-payment-info.ts';
import type { SupplierPaymentInfo } from '../../../types/supplier-payment-info.ts';

export async function getSupplierPaymentInfo(
  supplierId: string,
  orgId: string,
): Promise<SupplierPaymentInfo | null> {
  return getSupplierPaymentInfoAction(supplierId, orgId);
}
