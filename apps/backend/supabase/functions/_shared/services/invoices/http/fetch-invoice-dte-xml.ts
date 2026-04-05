/**
 * HTTP handler: PATCH /api/organizations/:orgId/invoices/:id/fetch-dte-xml
 *
 * Fetches the DTE XML from SII for a specific invoice and stores it.
 * Returns the updated invoice. Requires authentication.
 */

import { fetchInvoiceDteXmlHandler } from '../handlers/index.ts';
import {
  successResponse,
  notFoundResponse,
  validationError,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function fetchInvoiceDteXmlHttpHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/invoices/:id/fetch-dte-xml
    const orgId = segments[segments.length - 4];
    const id = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid invoice ID');

    const invoice = await fetchInvoiceDteXmlHandler(id, orgId);
    return successResponse(invoice, 'DTE XML fetched');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found') || (error as { code?: string }).code === 'NOT_FOUND') {
      return notFoundResponse('Invoice');
    }
    return serverError(msg);
  }
}
