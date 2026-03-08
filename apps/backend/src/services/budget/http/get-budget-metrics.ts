/**
 * HTTP handler: GET /api/organizations/:orgId/budget-items/metrics
 */

import { getBudgetMetrics } from '../handlers/index.js';
import { successResponse, serverError, validationError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function getBudgetMetricsHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/budget-items/metrics → orgId is at index -3
    const orgId = segments[segments.length - 3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    // Optional: comma-separated budget item IDs to filter the metrics
    const idsParam = url.searchParams.get('budgetItemIds');
    let budgetItemIds: string[] | undefined;
    if (idsParam) {
      budgetItemIds = idsParam
        .split(',')
        .map((id) => id.trim())
        .filter((id) => isValidUUID(id));
    }

    const result = await getBudgetMetrics(orgId, budgetItemIds);
    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
