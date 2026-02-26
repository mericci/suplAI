/**
 * HTTP handler: PUT /api/organizations/:orgId/invoices/:id
 */

import { updateInvoice } from '../handlers/index.js';
import {
  successResponse,
  notFoundResponse,
  validationError,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function updateInvoiceHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];
    const orgId = segments[segments.length - 3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid invoice ID');

    const body = await req.json();
    if (!body || typeof body !== 'object') return validationError('Invalid request body');

    const invoice = await updateInvoice(id, orgId, body);
    return successResponse(invoice, 'Invoice updated successfully');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Invoice');
    return serverError(msg);
  }
}
