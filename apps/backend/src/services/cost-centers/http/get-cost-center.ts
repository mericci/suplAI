/**
 * HTTP handler: GET /api/organizations/:orgId/cost-centers/:id
 */

import { getCostCenter } from '../handlers/index.js';
import { successResponse, serverError, validationError, notFoundResponse } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function getCostCenterHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];
    const orgId = segments[segments.length - 3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid cost center ID');

    const result = await getCostCenter(id, orgId);
    if (!result) return notFoundResponse('Cost center not found');
    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
