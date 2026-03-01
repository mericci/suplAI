/**
 * Delete Organization Action
 *
 * Soft-deletes an organization by setting deleted_at.
 * Will fail at the DB level if the organization has active users (RESTRICT FK).
 */

import { logger } from '../../../utils/logger.ts';
import * as orgDb from '../../../db/organization.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';

export async function deleteOrganization(id: string): Promise<void> {
  try {
    logger.info('Deleting organization', { organizationId: id });

    const existing = await orgDb.findById(id);
    if (!existing) {
      throw new Error('Organization not found');
    }

    await orgDb.softDeleteById(id);

    logger.info('Organization soft-deleted', { organizationId: id });
  } catch (error) {
    logger.error('Error deleting organization', {
      error: getErrorMessage(error),
    });
    throw error;
  }
}
