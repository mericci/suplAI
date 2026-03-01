/**
 * HTTP handler: PUT /api/organizations/:id
 */

import { updateOrganization } from '../handlers/index.ts';
import {
  successResponse,
  notFoundResponse,
  validationError,
  errorResponse,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import { HttpStatus } from '../../../types/api.ts';

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
