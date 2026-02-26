/**
 * HTTP handler: GET /api/sii/invoices/me
 * Query params: from (required, YYYY-MM), to (optional, YYYY-MM)
 * Credentials are resolved automatically from the authenticated user's org.
 */

import { getMyOrgSiiInvoices } from '../handlers/index.js';
import {
  successResponse,
  serverError,
  validationError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { RequestContext } from '../../../types/api.js';

const PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function isValidPeriod(value: unknown): value is string {
  return typeof value === 'string' && PERIOD_REGEX.test(value);
}

export async function getMyOrgSiiInvoicesHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.email) {
      return serverError('User email not available in token');
    }

    const url = new URL(req.url);
    const params = url.searchParams;
    const from = params.get('from');
    const to = params.get('to');

    if (!from) {
      return validationError('Missing required query param: from');
    }

    if (!isValidPeriod(from)) {
      return validationError('from must be a period in YYYY-MM format');
    }

    if (to !== null && to !== '' && !isValidPeriod(to)) {
      return validationError('to must be a period in YYYY-MM format');
    }

    const result = await getMyOrgSiiInvoices({
      email: context.email,
      from,
      to: to && to !== '' ? to : undefined,
    });

    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
