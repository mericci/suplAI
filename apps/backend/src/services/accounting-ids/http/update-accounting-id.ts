/**
 * HTTP handler: PUT /api/organizations/:orgId/accounting-ids/:id
 */

import { updateAccountingId } from '../handlers/index.js';
import { successResponse, serverError, validationError, notFoundResponse } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function updateAccountingIdHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];
    const orgId = segments[segments.length - 3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid accounting ID');

    const body = await req.json().catch(() => null);
    if (!body) return validationError('Request body is required');

    const result = await updateAccountingId(id, orgId, body);
    if (!result) return notFoundResponse('Accounting ID not found');
    return successResponse(result, 'ID contable actualizado');
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
