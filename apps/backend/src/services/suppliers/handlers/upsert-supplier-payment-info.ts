import type { SupplierPaymentInfo } from '@supl/shared';
import { upsertSupplierPaymentInfo as upsertSupplierPaymentInfoAction } from '../actions/upsert-supplier-payment-info.js';

export async function upsertSupplierPaymentInfo(
  supplierId: string,
  orgId: string,
  input: unknown,
): Promise<SupplierPaymentInfo> {
  return upsertSupplierPaymentInfoAction(supplierId, orgId, input);
}
