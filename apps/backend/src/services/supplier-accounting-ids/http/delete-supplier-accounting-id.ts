/**
 * HTTP handler: DELETE /api/organizations/:orgId/suppliers/:supplierId/accounting-ids/:id
 */

import { deleteSupplierAccountingId } from '../handlers/index.js';
import { successResponse, serverError, validationError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function deleteSupplierAccountingIdHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[3];
    const id = segments[7];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid ID');

    await deleteSupplierAccountingId(id, orgId);
    return successResponse({ deleted: true });
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
