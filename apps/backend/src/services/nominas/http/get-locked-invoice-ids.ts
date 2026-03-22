/**
 * HTTP handler: GET /api/organizations/:orgId/nominas/locked-invoice-ids
 */

import { getLockedInvoiceIds } from '../handlers/index.js';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function getLockedInvoiceIdsHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/nominas/locked-invoice-ids
    const orgId = segments[segments.length - 3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const ids = await getLockedInvoiceIds(orgId);
    return successResponse(ids);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
