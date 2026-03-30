/**
 * HTTP handler: GET /api/organizations/:orgId/suppliers/:supplierId/accounting-ids
 */

import { listSupplierAccountingIds } from '../handlers/index.js';
import { successResponse, serverError, validationError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function listSupplierAccountingIdsHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/suppliers/:supplierId/accounting-ids
    const orgId = segments[3];
    const supplierId = segments[5];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!supplierId || !isValidUUID(supplierId)) return validationError('Invalid supplier ID');

    const result = await listSupplierAccountingIds(supplierId, orgId);
    return successResponse(result);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
