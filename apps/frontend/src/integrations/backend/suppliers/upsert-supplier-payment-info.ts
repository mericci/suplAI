import type { SupplierPaymentInfo } from '@supl/shared';
import { backendClient, type ApiResponse } from '../client';

export interface UpsertSupplierPaymentInfoPayload {
  accountHolderName: string;
  taxIdentifier: string;
  bank: string;
  accountType: 'cuenta_corriente' | 'cuenta_vista' | 'cuenta_ahorro' | 'cuenta_rut';
  accountNumber: string;
  currency: 'CLP' | 'USD' | 'UF';
}

export async function upsertSupplierPaymentInfo(
  orgId: string,
  supplierId: string,
  payload: UpsertSupplierPaymentInfoPayload,
): Promise<ApiResponse<SupplierPaymentInfo>> {
  return backendClient.put<ApiResponse<SupplierPaymentInfo>>(
    `/api/organizations/${orgId}/suppliers/${supplierId}/payment-info`,
    payload,
  );
}
