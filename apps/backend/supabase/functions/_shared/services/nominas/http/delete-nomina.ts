/**
 * HTTP handler: DELETE /api/organizations/:orgId/nominas/:id (Edge Function)
 *
 * Admin only.
 */

import { deleteNomina } from '../handlers/index.ts';
import * as userDb from '../../../db/user.db.ts';
import {
  successResponse,
  validationError,
  errorResponse,
  notFoundResponse,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import { HttpStatus } from '../../../types/api.ts';
import type { RequestContext } from '../../../types/api.ts';

export async function deleteNominaHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[segments.length - 3];
    const id = segments[segments.length - 1];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid nomina ID');

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
