/**
 * List Organizations Action
 *
 * Returns a paginated list of active organizations.
 */

import { logger } from '../../../utils/logger.ts';
import * as orgDb from '../../../db/organization.db.ts';
import { validateOrganizationListFilters } from '../../../db/schemas/index.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { toPublic } from '../types/index.ts';
import type { OrganizationPublic } from '../types/index.ts';
import type { PaginatedResponse } from '../../../types/api.ts';

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
