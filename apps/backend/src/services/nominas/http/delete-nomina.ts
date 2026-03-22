/**
 * HTTP handler: DELETE /api/organizations/:orgId/nominas/:id
 *
 * Admin only.
 */

import { deleteNomina } from '../handlers/index.js';
import * as userDb from '../../../db/user.db.js';
import {
  successResponse,
  validationError,
  errorResponse,
  notFoundResponse,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import { HttpStatus } from '../../../types/api.js';
import type { RequestContext } from '../../../types/api.js';

export async function deleteNominaHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/nominas/:id
    const orgId = segments[segments.length - 3];
    const id = segments[segments.length - 1];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid nomina ID');

    // Admin check
    const user = await userDb.findById(context.userId!);
    if (!user || user.role !== 'admin') {
      return errorResponse('Forbidden', HttpStatus.FORBIDDEN);
    }

    await deleteNomina(id, orgId);
    return successResponse(null, 'Nomina deleted');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Nomina');
    return serverError(msg);
  }
}
