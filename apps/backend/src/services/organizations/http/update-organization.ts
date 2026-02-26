/**
 * HTTP handler: PUT /api/organizations/:id
 */

import { updateOrganization } from '../handlers/index.js';
import {
  successResponse,
  notFoundResponse,
  validationError,
  errorResponse,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import { HttpStatus } from '../../../types/api.js';

export async function updateOrganizationHandler(
  req: Request,
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];

    if (!id || !isValidUUID(id)) return validationError('Invalid organization ID format');

    const body = await req.json();
    if (!body || typeof body !== 'object') return validationError('Invalid request body');

    const org = await updateOrganization(id, body);

    return successResponse(org, 'Organization updated successfully');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Organization');
    if (msg.includes('already exists')) return errorResponse(msg, HttpStatus.CONFLICT);
    return serverError(msg);
  }
}
