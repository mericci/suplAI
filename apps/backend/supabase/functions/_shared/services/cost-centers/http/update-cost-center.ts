/**
 * HTTP handler: PUT /api/organizations/:orgId/cost-centers/:id (Edge Function)
 */

import { updateCostCenter } from '../handlers/index.ts';
import { successResponse, serverError, validationError, notFoundResponse } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function updateCostCenterHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];
    const orgId = segments[segments.length - 3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid cost center ID');

    const body = await req.json().catch(() => null);
    if (!body) return validationError('Request body is required');

    const result = await updateCostCenter(id, orgId, body);
    if (!result) return notFoundResponse('Cost center not found');
    return successResponse(result, 'Centro de costos actualizado');
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
