import type { UserPaymentInfo, AccountType } from '@supl/shared';
import { backendClient, type ApiResponse } from '../client';

export type { UserPaymentInfo, AccountType };

export async function listPaymentInfos(): Promise<ApiResponse<UserPaymentInfo[]>> {
  return backendClient.get<ApiResponse<UserPaymentInfo[]>>('/api/users/me/payment-info');
}

export async function createPaymentInfo(data: {
  bank: string;
  accountType: AccountType;
  accountNumber: string;
  isDefault?: boolean;
}): Promise<ApiResponse<UserPaymentInfo>> {
  return backendClient.post<ApiResponse<UserPaymentInfo>>('/api/users/me/payment-info', data);
}

export async function updatePaymentInfo(
  infoId: string,
  data: {
    bank?: string;
    accountType?: AccountType;
    accountNumber?: string;
    isDefault?: boolean;
  },
): Promise<ApiResponse<UserPaymentInfo>> {
  return backendClient.put<ApiResponse<UserPaymentInfo>>(
    `/api/users/me/payment-info/${infoId}`,
    data,
  );
}

export async function deletePaymentInfo(infoId: string): Promise<ApiResponse<null>> {
  return backendClient.del<ApiResponse<null>>(`/api/users/me/payment-info/${infoId}`);
}

export async function updateRut(rut: string): Promise<ApiResponse<unknown>> {
  return backendClient.patch<ApiResponse<unknown>>('/api/users/me/rut', { rut });
}
