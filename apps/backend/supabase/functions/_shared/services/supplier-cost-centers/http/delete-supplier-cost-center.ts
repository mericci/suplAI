import { deleteSupplierCostCenter } from '../handlers/index.ts';
import { successResponse, serverError, validationError } from '../../../utils/response.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function deleteSupplierCostCenterHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[3];
    const id = segments[7];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid ID');

    await deleteSupplierCostCenter(id, orgId);
    return successResponse({ deleted: true });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Unexpected error');
  }
}
