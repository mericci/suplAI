/**
 * HTTP handler: GET /api/organizations/:orgId/nominas/locked-invoice-ids (Edge Function)
 */

import { getLockedInvoiceIds } from '../handlers/index.ts';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function getLockedInvoiceIdsHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[segments.length - 3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const ids = await getLockedInvoiceIds(orgId);
    return successResponse(ids);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
