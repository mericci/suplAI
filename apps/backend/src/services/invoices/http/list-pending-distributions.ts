/**
 * HTTP handler: GET /api/organizations/:orgId/invoices/pending-distributions
 */

import { listPendingDistributions } from '../handlers/index.js';
import { successResponse, serverError, validationError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function listPendingDistributionsHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const result = await listPendingDistributions(orgId);
    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
