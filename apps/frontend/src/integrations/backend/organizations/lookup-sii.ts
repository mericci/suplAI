import type { LookupSiiData } from '@supl/shared';
import { backendClient, type ApiResponse } from '../client';

export async function lookupSii(payload: {
  taxIdentifier: string;
  taxAuthorityPassword: string;
}): Promise<ApiResponse<LookupSiiData>> {
  return backendClient.post<ApiResponse<LookupSiiData>>(
    '/api/organizations/lookup-sii',
    payload,
  );
}
