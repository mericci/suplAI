/**
 * Update User Handler
 *
 * Exposes the update user action
 */

import { updateUser as updateUserAction } from '../actions/update-user.ts';

/**
 * Handler that exposes the update user action
 * Data validation happens in the action layer
 */
export function updateUser(
  userId: string,
  updates: unknown,
): ReturnType<typeof updateUserAction> {
  return updateUserAction(userId, updates);
}
