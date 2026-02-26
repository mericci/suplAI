/**
 * HTTP handler: GET /api/users/me
 * Returns the authenticated user's profile by looking up their email from the JWT context.
 */

import { getMe } from '../handlers/index.js';
import {
  successResponse,
  notFoundResponse,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { RequestContext } from '../../../types/api.js';

export async function getMeHandler(
  _req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.email) {
      return serverError('User email not available in token');
    }

    const user = await getMe({ email: context.email });

    if (!user) return notFoundResponse('User');

    return successResponse(user);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
