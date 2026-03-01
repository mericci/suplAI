/**
 * HTTP handler: DELETE /api/organizations/:id
 */

import { deleteOrganization } from '../handlers/index.ts';
import {
  notFoundResponse,
  validationError,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import { HttpStatus } from '../../../types/api.ts';

export async function deleteOrganizationHandler(
  req: Request,
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];

    if (!id || !isValidUUID(id)) return validationError('Invalid organization ID format');

    await deleteOrganization(id);

    return new Response(null, { status: HttpStatus.NO_CONTENT });
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Organization');
    return serverError(msg);
  }
}
