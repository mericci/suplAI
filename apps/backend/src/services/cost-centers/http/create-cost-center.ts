/**
 * HTTP handler: POST /api/organizations/:orgId/cost-centers
 */

import { createCostCenter } from '../handlers/index.js';
import { successResponse, serverError, validationError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import { HttpStatus } from '../../../types/api.js';

export async function createCostCenterHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const body = await req.json().catch(() => null);
    if (!body) return validationError('Request body is required');

    const result = await createCostCenter(orgId, body);
    return successResponse(result, 'Centro de costos creado', HttpStatus.CREATED);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
