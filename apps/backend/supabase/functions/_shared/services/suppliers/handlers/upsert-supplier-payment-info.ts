import { upsertSupplierPaymentInfo as upsertSupplierPaymentInfoAction } from '../actions/upsert-supplier-payment-info.ts';
import type { SupplierPaymentInfo } from '../../../types/supplier-payment-info.ts';

export async function upsertSupplierPaymentInfo(
  supplierId: string,
  orgId: string,
  input: unknown,
): Promise<SupplierPaymentInfo> {
  return upsertSupplierPaymentInfoAction(supplierId, orgId, input);
}
