/**
 * Get User Action
 *
 * Retrieves a user by ID, optionally scoped to an organization.
 */

import { logger } from '../../../utils/logger.ts';
import * as userDb from '../../../db/user.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { Database } from '../../../types/supabase.ts';

type User = Database['public']['Tables']['users']['Row'];

export interface UserSearchParams {
  id?: string;
  email?: string;
  organizationId?: string;
}

export async function getUser(params: UserSearchParams): Promise<User> {
  try {
    logger.info('Getting user', { params });

    let user: User | null = null;

    if (params.id && params.organizationId) {
      user = await userDb.findByIdInOrganization(
        params.id,
        params.organizationId,
      );
    } else if (params.id) {
      user = await userDb.findById(params.id);
    } else if (params.email) {
      user = await userDb.findByEmail(params.email);
    } else {
      throw new Error(
        'No valid search criteria provided: id or email is required',
      );
    }

    if (!user) throw new Error('User not found');

    return user;
  } catch (error) {
    logger.error('Error getting user', { error: getErrorMessage(error) });
    throw error;
  }
}
