/**
 * HTTP handler: GET /api/users/me
 * Returns the authenticated user's profile by looking up their email from the JWT context.
 */

import { getMe } from '../handlers/index.ts';
import {
  successResponse,
  notFoundResponse,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { findCostCenterIdsByUser } from '../../../db/cost-center.db.ts';
import type { RequestContext } from '../../../types/api.ts';

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

    const costCenterIds = await findCostCenterIdsByUser(user.id);

    return successResponse({ ...user, cost_center_ids: costCenterIds });
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
