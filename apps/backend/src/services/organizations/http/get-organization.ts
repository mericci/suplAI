/**
 * HTTP handler: GET /api/organizations/:id
 */

import { getOrganization } from '../handlers/index.js';
import {
  successResponse,
  notFoundResponse,
  validationError,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

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
