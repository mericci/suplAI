/**
 * HTTP handler: PATCH /api/organizations/:orgId/invoices/:id/reject
 *
 * Requires authentication. The rejecting user ID is taken from the auth context.
 */

import { rejectInvoice } from '../handlers/index.ts';
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

export async function rejectInvoiceHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.userId) return unauthorizedResponse();

    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/invoices/:id/reject
    const orgId = segments[segments.length - 4];
    const id = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid invoice ID');

    const invoice = await rejectInvoice(id, orgId, context.userId);
    return successResponse(invoice, 'Invoice rejected');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Invoice');
    if (msg.includes('cannot be rejected')) return errorResponse(msg, HttpStatus.CONFLICT);
    return serverError(msg);
  }
}
