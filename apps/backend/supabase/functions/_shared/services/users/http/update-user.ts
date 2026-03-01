/**
 * HTTP handler: PUT /api/organizations/:orgId/users/:id
 */

import { updateUser } from '../handlers/index.ts';
import {
  successResponse,
  notFoundResponse,
  serverError,
  validationError,
} from '../../../utils/response.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import { getErrorMessage } from '../../../utils/error.ts';

export async function updateUserHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/users/:id
    const userId = segments[segments.length - 1];

    if (!userId || !isValidUUID(userId)) return validationError('Invalid user ID');

    const body = await req.json();
    if (!body || typeof body !== 'object') return validationError('Invalid request body');

    const user = await updateUser(userId, body);

    return successResponse(user, 'User updated successfully');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('User');
    return serverError(msg);
  }
}
