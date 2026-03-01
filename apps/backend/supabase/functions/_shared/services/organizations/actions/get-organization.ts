/**
 * Get Organization Action
 *
 * Retrieves a single organization by ID or tax identifier.
 */

import { logger } from '../../../utils/logger.ts';
import * as orgDb from '../../../db/organization.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { toPublic } from '../types/index.ts';
import type {
  OrganizationPublic,
  OrganizationSearchParams,
} from '../types/index.ts';

export async function getOrganization(
  params: OrganizationSearchParams,
): Promise<OrganizationPublic> {
  try {
    logger.info('Getting organization', { params });

    let org = null;

    if (params.id) {
      org = await orgDb.findById(params.id);
    } else if (params.taxIdentifier) {
      org = await orgDb.findByTaxIdentifier(params.taxIdentifier);
    } else {
      throw new Error(
        'No valid search criteria provided: id or taxIdentifier is required',
      );
    }

    if (!org) {
      throw new Error('Organization not found');
    }

    return toPublic(org);
  } catch (error) {
    logger.error('Error getting organization', {
      error: getErrorMessage(error),
    });
    throw error;
  }
}
