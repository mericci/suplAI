/**
 * HTTP handler: DELETE /api/organizations/:orgId/cost-centers/:id
 */

import { deleteCostCenter } from '../handlers/index.js';
import { successResponse, serverError, validationError, notFoundResponse } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function deleteCostCenterHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];
    const orgId = segments[segments.length - 3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid cost center ID');

    const deleted = await deleteCostCenter(id, orgId);
    if (!deleted) return notFoundResponse('Cost center not found');
    return successResponse(null, 'Centro de costos eliminado');
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
