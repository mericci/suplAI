/**
 * HTTP handler: GET /api/organizations/:orgId/budget-items
 */

import { listBudgetItems } from '../handlers/index.ts';
import { successResponse, serverError, validationError } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import type { BudgetPeriod } from '../types/index.ts';

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
