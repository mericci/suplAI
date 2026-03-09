/**
 * HTTP handler: GET /api/organizations/:orgId/budget-items/invoice-statuses
 */

import { getInvoiceBudgetStatuses } from '../handlers/index.ts';
import { successResponse, serverError, validationError } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function getInvoiceBudgetStatusesHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/budget-items/invoice-statuses → orgId at index -3
    const orgId = segments[segments.length - 3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const idsParam = url.searchParams.get('invoiceIds');
    if (!idsParam) return validationError('invoiceIds query parameter is required');

    const invoiceIds = idsParam
      .split(',')
      .map((id) => id.trim())
      .filter((id) => isValidUUID(id));

    if (invoiceIds.length === 0) return validationError('No valid invoice IDs provided');

    const result = await getInvoiceBudgetStatuses(orgId, invoiceIds);
    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
