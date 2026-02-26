/**
 * HTTP handler: PATCH /api/organizations/:orgId/invoices/:id/approve
 *
 * Requires authentication. The approving user ID is taken from the auth context.
 */

import { approveInvoice } from '../handlers/index.js';
import {
  successResponse,
  notFoundResponse,
  validationError,
  errorResponse,
  serverError,
  unauthorizedResponse,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import type { RequestContext } from '../../../types/api.js';
import { HttpStatus } from '../../../types/api.js';

export async function approveInvoiceHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.userId) return unauthorizedResponse();

    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/invoices/:id/approve
    const orgId = segments[segments.length - 4];
    const id = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid invoice ID');

    const invoice = await approveInvoice(id, orgId, context.userId);
    return successResponse(invoice, 'Invoice approved');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Invoice');
    if (msg.includes('cannot be approved')) return errorResponse(msg, HttpStatus.CONFLICT);
    return serverError(msg);
  }
}
