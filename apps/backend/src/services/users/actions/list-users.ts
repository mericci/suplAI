/**
 * List Users Action
 *
 * Returns paginated users scoped to an organization.
 */

import { logger } from '../../../utils/logger.js';
import * as userDb from '../../../db/user.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { Database } from '../../../types/supabase.js';
import type { PaginatedResponse } from '../../../types/api.js';

type User = Database['public']['Tables']['users']['Row'];

export async function listUsers(
  organizationId: string,
  page = 1,
  limit = 10,
): Promise<PaginatedResponse<User>> {
  try {
    logger.info('Listing users', { organizationId, page, limit });

    if (page < 1) throw new Error('Page must be greater than 0');
    if (limit < 1 || limit > 100) throw new Error('Limit must be between 1 and 100');

    const offset = (page - 1) * limit;
    const { users, total } = await userDb.findAllByOrganization(
      organizationId,
      limit,
      offset,
    );

    logger.info('Users fetched successfully', { count: users.length, total });

    return {
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error listing users', { error: getErrorMessage(error) });
    throw error;
  }
}
