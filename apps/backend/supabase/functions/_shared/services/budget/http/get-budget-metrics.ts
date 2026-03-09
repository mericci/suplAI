/**
 * HTTP handler: GET /api/organizations/:orgId/budget-items/metrics
 */

import { getBudgetMetrics } from '../handlers/index.ts';
import { successResponse, serverError, validationError } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function getBudgetMetricsHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/budget-items/metrics → orgId is at index -3
    const orgId = segments[segments.length - 3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

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
