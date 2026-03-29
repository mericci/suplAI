/**
 * HTTP handler: DELETE /api/organizations/:orgId/accounting-ids/:id (Edge Function)
 */

import { deleteAccountingId } from '../handlers/index.ts';
import { successResponse, serverError, validationError, notFoundResponse } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function deleteAccountingIdHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];
    const orgId = segments[segments.length - 3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid accounting ID');

    const deleted = await deleteAccountingId(id, orgId);
    if (!deleted) return notFoundResponse('Accounting ID not found');
    return successResponse(null, 'ID contable eliminado');
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
