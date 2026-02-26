/**
 * HTTP handler: DELETE /api/organizations/:orgId/users/:id
 */

import { deleteUser } from '../handlers/index.js';
import {
  notFoundResponse,
  serverError,
  validationError,
} from '../../../utils/response.js';
import { isValidUUID } from '../../../utils/validation.js';
import { getErrorMessage } from '../../../utils/error.js';
import { HttpStatus } from '../../../types/api.js';

export async function deleteUserHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const userId = segments[segments.length - 1];

    if (!userId || !isValidUUID(userId)) return validationError('Invalid user ID');

    await deleteUser(userId);

    return new Response(null, { status: HttpStatus.NO_CONTENT });
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('User');
    return serverError(msg);
  }
}
