/**
 * HTTP handler: GET /api/organizations/:orgId/cost-centers
 */

import { listCostCenters } from '../handlers/index.js';
import { successResponse, serverError, validationError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import type { ContabilidadPeriod } from '../types/index.js';

const VALID_PERIODS: ContabilidadPeriod[] = ['all', 'ytd', '1m', 'current_month', '1y'];

export async function listCostCentersHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const periodParam = url.searchParams.get('period') ?? 'current_month';
    if (!VALID_PERIODS.includes(periodParam as ContabilidadPeriod)) {
      return validationError(`Invalid period. Must be one of: ${VALID_PERIODS.join(', ')}`);
    }

    const result = await listCostCenters(orgId, periodParam as ContabilidadPeriod);
    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
