import { backendClient, type ApiResponse } from '../client';

interface PingResponse {
  status: string;
  timestamp: string;
}

export async function ping(): Promise<ApiResponse<PingResponse>> {
  return backendClient.get<ApiResponse<PingResponse>>('/api/test/ping');
}
