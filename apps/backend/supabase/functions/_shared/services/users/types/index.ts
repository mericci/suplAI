/**
 * Users Service Types
 *
 * Types used ONLY within the users service
 * If a type is used in multiple services, move it to src/types/
 */

/**
 * User search parameters
 * Used in get-user action
 */
export interface UserSearchParams {
  id?: string;
  email?: string;
  phone?: string;
  username?: string;
}

/**
 * User creation input (extended from database type)
 */
export interface UserCreationData {
  email: string;
  name?: string;
  password?: string;
  avatar_url?: string;
  metadata?: Record<string, unknown>;
}

/**
 * User update input (extended from database type)
 */
export interface UserUpdateData {
  name?: string;
  avatar_url?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}

/**
 * User list filters
 */
export interface UserListFilters {
  status?: 'active' | 'inactive' | 'suspended';
  role?: 'user' | 'moderator' | 'admin';
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * User validation result
 */
export interface UserValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * User profile (extended user data)
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  // Add more profile-specific fields
}
