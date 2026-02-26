/**
 * HTTP handler: GET /api/organizations/:orgId/invoices
 */

import { listInvoices } from '../handlers/index.js';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function listInvoicesHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/invoices
    const orgId = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const filters = {
      status: url.searchParams.get('status') ?? undefined,
      supplierId: url.searchParams.get('supplierId') ?? undefined,
      issuedAfter: url.searchParams.get('issuedAfter') ?? undefined,
      issuedBefore: url.searchParams.get('issuedBefore') ?? undefined,
      page: url.searchParams.has('page')
        ? Number(url.searchParams.get('page'))
        : undefined,
      limit: url.searchParams.has('limit')
        ? Number(url.searchParams.get('limit'))
        : undefined,
    };

    const result = await listInvoices(orgId, filters);
    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
