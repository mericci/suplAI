/**
 * Delete User Handler
 *
 * Exposes the delete user action
 */

import { deleteUser as deleteUserAction } from '../actions/delete-user.ts';

/**
 * Handler that exposes the delete user action
 */
export function deleteUser(
  userId: string,
): ReturnType<typeof deleteUserAction> {
  return deleteUserAction(userId);
}
