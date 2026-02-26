/**
 * List Organizations Action
 *
 * Returns a paginated list of active organizations.
 */

import { logger } from '../../../utils/logger.js';
import * as orgDb from '../../../db/organization.db.js';
import { validateOrganizationListFilters } from '../../../db/schemas/index.js';
import { getErrorMessage } from '../../../utils/error.js';
import { toPublic } from '../types/index.js';
import type { OrganizationPublic } from '../types/index.js';
import type { PaginatedResponse } from '../../../types/api.js';

export async function listOrganizations(
  filters: unknown,
): Promise<PaginatedResponse<OrganizationPublic>> {
  try {
    const validated = validateOrganizationListFilters(filters);
    const offset = (validated.page - 1) * validated.limit;

    logger.info('Listing organizations', {
      page: validated.page,
      limit: validated.limit,
    });

    const { organizations, total } = await orgDb.findAll(
      validated.limit,
      offset,
      validated.search,
    );

    const totalPages = Math.ceil(total / validated.limit);

    return {
      success: true,
      data: organizations.map(toPublic),
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    logger.error('Error listing organizations', {
      error: getErrorMessage(error),
    });
    throw error;
  }
}
