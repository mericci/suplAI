/**
 * HTTP handler: DELETE /api/organizations/:orgId/budget-items/:id
 */

import { deleteBudgetItem } from '../handlers/index.ts';
import { successResponse, serverError, validationError, notFoundResponse } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function deleteBudgetItemHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];
    const orgId = segments[segments.length - 3];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid budget item ID');

    try {
      await deleteBudgetItem(id, orgId);
    } catch (e) {
      if (getErrorMessage(e).includes('not found')) return notFoundResponse('Budget item');
      throw e;
    }

    return successResponse(null, 'Budget item deleted');
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
