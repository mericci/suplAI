import { backendClient, type ApiResponse } from '../client';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  role: string;
  organization_id: string;
  cost_center_ids: string[];
}

export async function getMe(): Promise<ApiResponse<UserProfile>> {
  return backendClient.get<ApiResponse<UserProfile>>('/api/users/me');
}
