import { listSupplierAccountingIds } from '../handlers/index.ts';
import { successResponse, serverError, validationError } from '../../../utils/response.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function listSupplierAccountingIdsHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[3];
    const supplierId = segments[5];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!supplierId || !isValidUUID(supplierId)) return validationError('Invalid supplier ID');

    const result = await listSupplierAccountingIds(supplierId, orgId);
    return successResponse(result);
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Unexpected error');
  }
}
