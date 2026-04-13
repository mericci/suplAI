export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: string;
  status: string;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  organizationId: string | null;
  role: string;
  status: string;
}

export interface CreateUserPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'aprobador' | 'standard' | 'rendidor' | 'super_admin';
  status?: 'active' | 'inactive';
  password?: string;
}

export interface UpdateUserPayload {
  email?: string;
  name?: string;
  avatar_url?: string;
  phone?: string;
  role?: string;
  status?: string;
  metadata?: Record<string, unknown>;
  password?: string;
}
