/**
 * HTTP handler: GET /api/organizations/:orgId/users
 */

import { listUsers } from '../handlers/index.ts';
import {
  successResponse,
  serverError,
  validationError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function listUsersHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/users
    const orgId = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const page = parseInt(url.searchParams.get('page') ?? '1', 10);
    const limit = parseInt(url.searchParams.get('limit') ?? '10', 10);

    if (page < 1 || limit < 1 || limit > 100) {
      return validationError('Invalid pagination parameters');
    }

    const result = await listUsers(orgId, page, limit);

    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
