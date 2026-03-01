/**
 * Delete User Action (soft delete)
 */

import { logger } from '../../../utils/logger.ts';
import * as userDb from '../../../db/user.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';

export async function deleteUser(userId: string): Promise<void> {
  try {
    logger.info('Soft-deleting user', { userId });

    const existing = await userDb.findById(userId);
    if (!existing) throw new Error('User not found');

    await userDb.softDeleteById(userId);

    logger.info('User soft-deleted', { userId });
  } catch (error) {
    logger.error('Error deleting user', {
      userId,
      error: getErrorMessage(error),
    });
    throw error;
  }
}
