/**
 * HTTP handler: GET /api/organizations/:orgId/users/:id
 */

import { getUser } from '../handlers/index.js';
import {
  successResponse,
  notFoundResponse,
  serverError,
  validationError,
} from '../../../utils/response.js';
import { isValidUUID } from '../../../utils/validation.js';
import { getErrorMessage } from '../../../utils/error.js';

export async function getUserHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/users/:id
    const id = segments[segments.length - 1];
    const orgId = segments[segments.length - 3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid user ID');

    const user = await getUser({ id, organizationId: orgId });

    return successResponse(user);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('User');
    return serverError(msg);
  }
}
