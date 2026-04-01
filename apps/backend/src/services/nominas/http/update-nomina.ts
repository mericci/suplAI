/**
 * HTTP handler: PATCH /api/organizations/:orgId/nominas/:id
 *
 * Admin only. Replaces the invoice list of a pending nomina.
 */

import { updateNomina } from '../handlers/index.js';
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

export async function updateNominaHandler(
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
    const user = context.email ? await userDb.findByEmail(context.email) : null;
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return errorResponse('Forbidden', HttpStatus.FORBIDDEN);
    }

    const body = await req.json();
    const updated = await updateNomina(id, orgId, body);
    return successResponse(updated, 'Nomina updated');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Nomina');
    if (msg.includes('not approved') || msg.includes('already in another') || msg.includes('Only pending')) {
      return errorResponse(msg, HttpStatus.CONFLICT);
    }
    return serverError(msg);
  }
}
