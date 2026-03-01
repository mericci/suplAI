/**
 * HTTP handler: DELETE /api/organizations/:orgId/users/:id
 */

import { deleteUser } from '../handlers/index.ts';
import {
  notFoundResponse,
  serverError,
  validationError,
} from '../../../utils/response.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { HttpStatus } from '../../../types/api.ts';

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
