/**
 * HTTP handler: PATCH /api/organizations/:orgId/invoices/:id/pay
 *
 * Marks an approved invoice as paid. Requires authentication.
 */

import { payInvoice } from '../handlers/index.ts';
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

export async function payInvoiceHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/invoices/:id/pay
    const orgId = segments[segments.length - 4];
    const id = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid invoice ID');

    const invoice = await payInvoice(id, orgId);
    return successResponse(invoice, 'Invoice marked as paid');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Invoice');
    if (msg.includes('cannot be marked as paid')) return errorResponse(msg, HttpStatus.CONFLICT);
    return serverError(msg);
  }
}
