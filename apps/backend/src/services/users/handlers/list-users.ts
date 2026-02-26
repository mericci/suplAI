import { listUsers as listUsersAction } from '../actions/list-users.js';

export function listUsers(
  organizationId: string,
  page?: number,
  limit?: number,
): ReturnType<typeof listUsersAction> {
  return listUsersAction(organizationId, page, limit);
}
