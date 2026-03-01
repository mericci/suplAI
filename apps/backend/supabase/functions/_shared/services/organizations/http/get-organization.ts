/**
 * HTTP handler: GET /api/organizations/:id
 */

import { getOrganization } from '../handlers/index.ts';
import {
  successResponse,
  notFoundResponse,
  validationError,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function getOrganizationHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];

    if (!id) return validationError('Organization ID is required');

    if (!isValidUUID(id)) return validationError('Invalid organization ID format');

    const org = await getOrganization({ id });

    return successResponse(org);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Organization');
    return serverError(msg);
  }
}
