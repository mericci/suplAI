/**
 * User Validation Helpers
 *
 * Helper functions specific to user validation
 * These are only used within the users service
 */

import { isValidEmail } from '../../../utils/validation.ts';
import type { Database } from '../../../types/supabase.ts';
import { USER_CONFIG } from '../config.ts';

type CreateUserInput = Database['public']['Tables']['users']['Insert'];

/**
 * Validate user data before creating/updating
 */
export function validateUserData(userData: CreateUserInput): void {
  // Validate email
  if (!userData.email) {
    throw new Error('Email is required');
  }

  if (!isValidEmail(userData.email)) {
    throw new Error('Invalid email format');
  }

  // Validate name if provided
  if (userData.name && userData.name.length < USER_CONFIG.MIN_NAME_LENGTH) {
    throw new Error(
      `Name must be at least ${USER_CONFIG.MIN_NAME_LENGTH} characters long`,
    );
  }

  if (userData.name && userData.name.length > USER_CONFIG.MAX_NAME_LENGTH) {
    throw new Error(
      `Name must not exceed ${USER_CONFIG.MAX_NAME_LENGTH} characters`,
    );
  }

  // Add more user-specific validations here
}

/**
 * Check if user data has required fields for update
 */
export function hasValidUpdateFields(
  updates: Record<string, unknown>,
): boolean {
  const validFields = ['email', 'name', 'avatar_url'];
  const providedFields = Object.keys(updates);

  // Check if at least one valid field is provided
  return providedFields.some((field) => validFields.includes(field));
}
