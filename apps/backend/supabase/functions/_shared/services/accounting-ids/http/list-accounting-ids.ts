/**
 * HTTP handler: GET /api/organizations/:orgId/accounting-ids (Edge Function)
 */

import { listAccountingIds } from '../handlers/index.ts';
import { successResponse, serverError, validationError } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import type { ContabilidadPeriod } from '../types/index.ts';

const VALID_PERIODS: ContabilidadPeriod[] = ['all', 'ytd', '1m', 'current_month', '1y'];

export async function listAccountingIdsHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const periodParam = url.searchParams.get('period') ?? 'current_month';
    if (!VALID_PERIODS.includes(periodParam as ContabilidadPeriod)) {
      return validationError(`Invalid period. Must be one of: ${VALID_PERIODS.join(', ')}`);
    }

    const result = await listAccountingIds(orgId, periodParam as ContabilidadPeriod);
    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
