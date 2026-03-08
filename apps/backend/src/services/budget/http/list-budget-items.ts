/**
 * HTTP handler: GET /api/organizations/:orgId/budget-items
 */

import { listBudgetItems } from '../handlers/index.js';
import { successResponse, serverError, validationError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import type { BudgetPeriod } from '../types/index.js';

const VALID_PERIODS: BudgetPeriod[] = ['current_month', 'ytd', 'annual'];

export async function listBudgetItemsHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const periodParam = url.searchParams.get('period') ?? 'current_month';
    if (!VALID_PERIODS.includes(periodParam as BudgetPeriod)) {
      return validationError('Invalid period. Must be one of: current_month, ytd, annual');
    }

    const result = await listBudgetItems(orgId, periodParam as BudgetPeriod);
    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
