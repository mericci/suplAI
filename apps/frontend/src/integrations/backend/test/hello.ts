import { backendClient, type ApiResponse } from '../client';

interface HelloResponse {
  message: string;
  timestamp: string;
  environment: string;
}

export async function hello(
  name?: string,
): Promise<ApiResponse<HelloResponse>> {
  const params = name ? { name } : undefined;
  return backendClient.get<ApiResponse<HelloResponse>>(
    '/api/test/hello',
    params,
  );
}
