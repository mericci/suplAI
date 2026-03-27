/**
 * HTTP handler: PATCH /api/organizations/:orgId/invoices/:id/approve
 *
 * Requires authentication. The approving user ID is taken from the auth context.
 */

import { approveInvoice } from '../handlers/index.ts';
import * as userDb from '../../../db/user.db.ts';
import {
  successResponse,
  notFoundResponse,
  validationError,
  errorResponse,
  serverError,
  unauthorizedResponse,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import type { RequestContext } from '../../../types/api.ts';
import { HttpStatus } from '../../../types/api.ts';

export async function approveInvoiceHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.email) return unauthorizedResponse();

    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/invoices/:id/approve
    const orgId = segments[segments.length - 4];
    const id = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid invoice ID');

    const user = await userDb.findByEmail(context.email);
    if (!user) return unauthorizedResponse();

    const invoice = await approveInvoice(id, orgId, user.id);
    return successResponse(invoice, 'Invoice approved');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Invoice');
    if (msg.includes('cannot be approved')) return errorResponse(msg, HttpStatus.CONFLICT);
    return serverError(msg);
  }
}
