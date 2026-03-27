/**
 * HTTP handler: POST /api/organizations/:orgId/nominas
 *
 * Admin only.
 */

import { createNomina } from '../handlers/index.js';
import * as userDb from '../../../db/user.db.js';
import {
  successResponse,
  validationError,
  errorResponse,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import { HttpStatus } from '../../../types/api.js';
import type { RequestContext } from '../../../types/api.js';

export async function createNominaHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/nominas
    const orgId = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    // Admin check
    const user = context.email ? await userDb.findByEmail(context.email) : null;
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return errorResponse('Forbidden', HttpStatus.FORBIDDEN);
    }

    const body = await req.json() as Record<string, unknown>;
    const nomina = await createNomina(orgId, user.id, body);
    return successResponse(nomina, 'Nomina created', HttpStatus.CREATED);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not approved') || msg.includes('already in a pending') || msg.includes('No approved')) {
      return errorResponse(msg, HttpStatus.CONFLICT);
    }
    if (msg.includes('Invalid') || msg.includes('required')) return validationError(msg);
    return serverError(msg);
  }
}
